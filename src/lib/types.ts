export type FitMode = "ratio" | "percentage" | "fixed";
export type Position = "bottom" | "top" | "overlay-bottom" | "overlay-top";

export interface FooterTemplate {
  id: string;
  name: string;
  imageUrl: string; // Base64 or Blob URL representing the footer image
  width: number;
  height: number;
  aspectRatio: number;
  defaultHeightMode: FitMode;
  defaultHeightValue: number;
  position: Position;
  opacity: number;
  safeArea: { left: number; right: number };
  createdAt: string;
  updatedAt: string;
}

export interface ImageOverride {
  footerScale?: number;
  footerHeight?: number;
  footerX?: number;
  footerY?: number;
  footerOpacity?: number;
  crop?: { x: number; y: number; width: number; height: number };
  rotation?: number;
}

export interface ImageJob {
  id: string;
  projectId: string;
  originalFile?: File; // Temporary in-memory file for initial upload queue, not saved to DB
  originalName: string;
  width: number;
  height: number;
  fileSize: number;
  status: "ready" | "processing" | "completed" | "edited" | "failed";
  outputUrl?: string; // Blob URL of the processed image
  error?: string;
  override?: ImageOverride;
}

export interface Project {
  id: string;
  name: string;
  templateId: string | null;
  status: "draft" | "processing" | "completed";
  imageCount: number;
  completedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingSettings {
  outputFormat: "image/jpeg" | "image/png" | "image/webp";
  quality: number;
  filenameSuffix: string;
}
