import { ImageJob, FooterTemplate, ProcessingSettings } from './types';
import { renderImageWithFooter, loadImage } from './engine';
import { saveJob } from './db';

const BATCH_SIZE = 10;

export class BatchProcessor {
  private jobs: ImageJob[];
  private template: FooterTemplate;
  private settings: ProcessingSettings;
  private footerImage: HTMLImageElement | null = null;
  private isProcessing = false;
  private onProgress: (completed: number, total: number) => void;
  private onComplete: () => void;
  private currentIndex = 0;

  constructor(
    jobs: ImageJob[],
    template: FooterTemplate,
    settings: ProcessingSettings,
    onProgress: (completed: number, total: number) => void,
    onComplete: () => void
  ) {
    this.jobs = jobs;
    this.template = template;
    this.settings = settings;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
  }

  async start() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.currentIndex = 0;
    
    try {
      this.footerImage = await loadImage(this.template.imageUrl);
      this.processNextBatch();
    } catch (e) {
      console.error("Failed to load footer image", e);
      this.isProcessing = false;
    }
  }

  stop() {
    this.isProcessing = false;
  }

  private async processNextBatch() {
    if (!this.isProcessing) return;

    const endIndex = Math.min(this.currentIndex + BATCH_SIZE, this.jobs.length);
    const batch = this.jobs.slice(this.currentIndex, endIndex);

    if (batch.length === 0) {
      this.isProcessing = false;
      this.onComplete();
      return;
    }

    const promises = batch.map(async (job) => {
      try {
        if (!job.originalFile) throw new Error("Missing original file");
        
        const srcUrl = URL.createObjectURL(job.originalFile);
        const sourceImage = await loadImage(srcUrl);
        
        const blob = await renderImageWithFooter(
          sourceImage,
          this.footerImage!,
          this.template,
          job.override,
          this.settings
        );
        
        URL.revokeObjectURL(srcUrl);
        
        const outputUrl = URL.createObjectURL(blob);
        
        job.status = "completed";
        job.outputUrl = outputUrl;
        
      } catch (err: any) {
        job.status = "failed";
        job.error = err.message;
      }
      
      // Save job state to IDB
      await saveJob({ ...job, originalFile: undefined }); // Don't try to store File object directly
    });

    await Promise.all(promises);

    this.currentIndex = endIndex;
    this.onProgress(this.currentIndex, this.jobs.length);

    // Yield to browser
    setTimeout(() => this.processNextBatch(), 50);
  }
}
