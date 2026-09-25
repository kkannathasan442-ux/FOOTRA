"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { 
  UploadCloud, 
  Settings, 
  Play, 
  Pause,
  CheckCircle, 
  Download, 
  Eye, 
  Plus, 
  Image as ImageIcon, 
  Layers, 
  Sparkles, 
  RotateCcw, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Search
} from "lucide-react";
import { FooterTemplate, ImageJob, ProcessingSettings, Project } from "@/lib/types";
import { getTemplates, saveProject, saveTemplate } from "@/lib/db";
import { BatchProcessor } from "@/lib/queue";
import { downloadZip } from "@/lib/zip";
import Link from "next/link";

export default function Workspace() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [templates, setTemplates] = useState<FooterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FooterTemplate | null>(null);
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Interactive Preview State
  const [previewMode, setPreviewMode] = useState<"single" | "grid">("single");
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gridSearch, setGridSearch] = useState("");
  const [thumbnailUrls, setThumbnailUrls] = useState<{ [id: string]: string }>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [customFooterUrl, setCustomFooterUrl] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<ProcessingSettings>({
    outputFormat: "image/jpeg",
    quality: 0.95,
    filenameSuffix: "_footer"
  });

  const filmstripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTemplates().then(t => {
      setTemplates(t);
      if (t.length > 0 && !selectedTemplate) {
        setSelectedTemplate(t[0]);
      }
    });
  }, []);

  // Generate thumbnail object URLs for fast previews
  useEffect(() => {
    const urls: { [id: string]: string } = {};
    jobs.forEach(job => {
      if (job.originalFile) {
        urls[job.id] = URL.createObjectURL(job.originalFile);
      }
    });
    setThumbnailUrls(urls);

    return () => {
      Object.values(urls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [jobs]);

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    const newJobs: ImageJob[] = list
      .filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|svg|tiff?|jfif|heic|avif)$/i.test(f.name))
      .map(f => ({
        id: crypto.randomUUID(),
        projectId: "temp",
        originalFile: f,
        originalName: f.name,
        width: 0,
        height: 0,
        fileSize: f.size,
        status: "ready"
      }));

    if (newJobs.length === 0) {
      alert("No valid images selected. Please select PNG, JPG, or WEBP files.");
      return;
    }
    const combined = [...jobs, ...newJobs];
    setJobs(combined);
    setCurrentPreviewIndex(0);
    setStep(2);
  };

  const handleCustomFooter = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const quickTemplate: FooterTemplate = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Custom Footer",
          imageUrl: dataUrl,
          width: img.naturalWidth || img.width || 1200,
          height: img.naturalHeight || img.height || 140,
          aspectRatio: (img.naturalWidth || img.width || 1200) / (img.naturalHeight || img.height || 140),
          defaultHeightMode: "ratio",
          defaultHeightValue: 10,
          position: "overlay-bottom",
          opacity: 1,
          safeArea: { left: 0, right: 0 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await saveTemplate(quickTemplate);
        setTemplates(prev => [quickTemplate, ...prev]);
        setSelectedTemplate(quickTemplate);
        setCustomFooterUrl(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Update current active single photo preview
  useEffect(() => {
    const activeJob = jobs[currentPreviewIndex];
    if (activeJob?.originalFile) {
      const objectUrl = URL.createObjectURL(activeJob.originalFile);
      setPreviewDataUrl(objectUrl);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setPreviewDataUrl(null);
    }
  }, [currentPreviewIndex, jobs]);

  // Next & Previous Navigation handlers
  const handlePrev = useCallback(() => {
    setCurrentPreviewIndex(prev => (prev > 0 ? prev - 1 : jobs.length - 1));
  }, [jobs.length]);

  const handleNext = useCallback(() => {
    setCurrentPreviewIndex(prev => (prev < jobs.length - 1 ? prev + 1 : 0));
  }, [jobs.length]);

  // Keyboard navigation (Left Arrow ← and Right Arrow →)
  useEffect(() => {
    if (step !== 3 || previewMode !== "single") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, previewMode, handlePrev, handleNext]);

  // Auto-play slideshow effect
  useEffect(() => {
    if (!isPlaying || step !== 3 || previewMode !== "single" || jobs.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPreviewIndex(prev => (prev < jobs.length - 1 ? prev + 1 : 0));
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, step, previewMode, jobs.length]);

  // Scroll active thumbnail into view in filmstrip
  useEffect(() => {
    if (filmstripRef.current && previewMode === "single") {
      const activeEl = filmstripRef.current.children[currentPreviewIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [currentPreviewIndex, previewMode]);

  const startProcessing = async () => {
    if (!selectedTemplate) return alert("Please select or upload a footer template.");
    if (jobs.length === 0) return alert("Please upload at least one image.");
    
    setIsPlaying(false);
    setStep(4);
    setIsProcessing(true);
    setProgress(0);
    
    const project: Project = {
      id: crypto.randomUUID(),
      name: `Bulk Job - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      templateId: selectedTemplate.id,
      status: "processing",
      imageCount: jobs.length,
      completedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const projectJobs = jobs.map(j => ({ ...j, projectId: project.id }));
    setJobs(projectJobs);
    await saveProject(project);

    const processor = new BatchProcessor(
      projectJobs,
      selectedTemplate,
      settings,
      (completed, total) => {
        const pct = (completed / total) * 100;
        setProgress(pct);
        setJobs([...projectJobs]);
      },
      async () => {
        setIsProcessing(false);
        setStep(5);
        project.status = "completed";
        project.completedCount = projectJobs.filter(j => j.status === 'completed').length;
        await saveProject(project);
      }
    );
    
    processor.start();
  };

  const removeJob = (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    if (currentPreviewIndex >= updated.length) {
      setCurrentPreviewIndex(Math.max(0, updated.length - 1));
    }
  };

  const filteredJobs = gridSearch.trim()
    ? jobs.filter((j, i) => j.originalName.toLowerCase().includes(gridSearch.toLowerCase()) || `photo ${i + 1}`.includes(gridSearch.toLowerCase()))
    : jobs;

  const currentJob = jobs[currentPreviewIndex];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Header & Steps Nav */}
      <div className="header-flex" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Bulk Footer Processor</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Batch overlay footer banners onto photos with automatic scaling across any image size.
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "8px", 
          alignItems: "center", 
          background: "var(--bg-panel)", 
          padding: "8px 16px", 
          borderRadius: "12px", 
          border: "1px solid var(--border)",
          fontSize: "0.85rem"
        }}>
          {[
            { num: 1, label: "Upload" },
            { num: 2, label: "Footer" },
            { num: 3, label: "Preview & Settings" },
            { num: 4, label: "Processing" },
            { num: 5, label: "Done" }
          ].map((s, idx) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ 
                width: "22px", 
                height: "22px", 
                borderRadius: "50%", 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: step >= s.num ? "var(--accent)" : "rgba(255,255,255,0.1)",
                color: step >= s.num ? "#fff" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 600
              }}>
                {s.num}
              </span>
              <span style={{ color: step >= s.num ? "var(--text-main)" : "var(--text-muted)", fontWeight: step === s.num ? 600 : 400 }}>
                {s.label}
              </span>
              {idx < 4 && <span style={{ color: "var(--border)" }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Upload Photos */}
      {step === 1 && (
        <div style={{ marginTop: "20px" }}>
          <label 
            htmlFor="bulk-photos-input"
            className="dropzone" 
            onDrop={(e) => { 
              e.preventDefault(); 
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); 
            }}
            onDragOver={(e) => e.preventDefault()}
            style={{ padding: "80px 24px", cursor: "pointer", display: "block" }}
          >
            <div style={{ 
              width: "72px", 
              height: "72px", 
              borderRadius: "50%", 
              background: "rgba(59, 130, 246, 0.15)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "var(--accent)"
            }}>
              <UploadCloud size={36} />
            </div>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "8px", fontWeight: 600 }}>Drop Photos Here or Click to Browse</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "500px", margin: "0 auto 24px" }}>
              Upload any quantity of event, cricket, sports, or party photos. Supports JPG, PNG, WEBP in portrait, landscape, or square orientations.
            </p>
            <span className="btn" style={{ padding: "12px 28px", fontSize: "1rem", display: "inline-flex", pointerEvents: "none" }}>
              Select Images From Computer
            </span>
            <input 
              id="bulk-photos-input"
              type="file" 
              accept="image/png,image/jpeg,image/webp,image/*" 
              multiple
              style={{ display: "none" }} 
              onChange={(e) => { 
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files); 
                }
              }}
            />
          </label>
        </div>
      )}

      {/* STEP 2: Select or Upload Footer Banner */}
      {step === 2 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", marginTop: "20px" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Choose Footer Banner</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Selected banner will automatically fit across all {jobs.length} images.
                </p>
              </div>
              <label 
                htmlFor="quick-footer-input"
                className="btn btn-secondary" 
                style={{ fontSize: "0.85rem", padding: "8px 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={16} /> Upload New PNG
              </label>
            </div>

            {/* Quick Upload Bar */}
            <label 
              htmlFor="quick-footer-input"
              style={{ 
                border: "2px dashed var(--border)", 
                borderRadius: "10px", 
                padding: "20px", 
                textAlign: "center", 
                marginBottom: "20px",
                cursor: "pointer",
                background: "rgba(0,0,0,0.2)",
                display: "block"
              }}
            >
              <UploadCloud size={24} style={{ color: "var(--accent)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 500 }}>Click to quick-upload a tournament/event footer PNG</p>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Transparent PNG recommended</span>
              <input 
                id="quick-footer-input"
                type="file" 
                accept="image/png,image/jpeg,image/webp,image/*" 
                style={{ display: "none" }} 
                onChange={(e) => { 
                  if (e.target.files?.[0]) {
                    handleCustomFooter(e.target.files[0]); 
                  }
                }}
              />
            </label>

            {/* Existing Templates Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", maxHeight: "350px", overflowY: "auto" }}>
              {templates.map(t => {
                const isSelected = selectedTemplate?.id === t.id;
                return (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTemplate(t)}
                    style={{ 
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, 
                      padding: "12px", 
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(0,0,0,0.2)",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ 
                      height: "80px", 
                      background: "#0b0f19", 
                      borderRadius: "6px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      padding: "8px",
                      marginBottom: "10px"
                    }}>
                      <img src={t.imageUrl} alt={t.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {t.position} • Auto 100% Width
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back to Upload</button>
              <button className="btn" disabled={!selectedTemplate} onClick={() => setStep(3)}>
                Next: Interactive Preview & Settings
              </button>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="var(--accent)" /> Uploaded Queue ({jobs.length} Images)
            </h3>
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "360px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "8px 12px", 
                    background: "rgba(0,0,0,0.2)", 
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    fontSize: "0.85rem"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                    {job.originalName}
                  </span>
                  <button 
                    onClick={() => removeJob(job.id)} 
                    style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <label 
              htmlFor="add-more-photos-input"
              className="btn btn-secondary" 
              style={{ marginTop: "16px", width: "100%", fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add More Photos
              <input 
                id="add-more-photos-input"
                type="file" 
                accept="image/png,image/jpeg,image/webp,image/*" 
                multiple
                style={{ display: "none" }} 
                onChange={(e) => { 
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files); 
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 3: Interactive Live Preview & Settings */}
      {step === 3 && selectedTemplate && (
        <div style={{ display: "grid", gridTemplateColumns: previewMode === "single" ? "1.4fr 0.6fr" : "1fr", gap: "24px", marginTop: "20px" }}>
          
          {/* Main Interactive Preview Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            
            {/* Top Toolbar: View Switcher, Rapid Slider, Counter & Auto-Play */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", background: "rgba(0,0,0,0.35)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  <button 
                    type="button"
                    onClick={() => setPreviewMode("single")}
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: previewMode === "single" ? "var(--accent)" : "transparent",
                      color: previewMode === "single" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Eye size={16} /> Single Flip View
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setPreviewMode("grid"); setIsPlaying(false); }}
                    style={{
                      padding: "6px 14px",
                      fontSize: "0.85rem",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: previewMode === "grid" ? "var(--accent)" : "transparent",
                      color: previewMode === "grid" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <LayoutGrid size={16} /> All Photos Grid ({jobs.length})
                  </button>
                </div>

                {previewMode === "single" && (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px" }}>
                    Keyboard: <strong>←</strong> / <strong>→</strong> keys
                  </span>
                )}
              </div>

              {/* Single View Navigation Toolbar */}
              {previewMode === "single" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
                    title="Auto-play preview through all photos"
                  >
                    {isPlaying ? <Pause size={14} color="#facc15" /> : <Play size={14} color="#10b981" />}
                    <span>{isPlaying ? "Pause" : "Auto Slideshow"}</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <button 
                      type="button"
                      onClick={handlePrev}
                      className="btn btn-secondary"
                      style={{ padding: "6px 10px", border: "none" }}
                      title="Previous Photo (Left Arrow)"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, minWidth: "90px", textAlign: "center" }}>
                      {currentPreviewIndex + 1} / {jobs.length}
                    </span>

                    <button 
                      type="button"
                      onClick={handleNext}
                      className="btn btn-secondary"
                      style={{ padding: "6px 10px", border: "none" }}
                      title="Next Photo (Right Arrow)"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input 
                    type="text" 
                    placeholder="Search photos..." 
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: "32px", fontSize: "0.8rem", padding: "6px 10px 6px 30px" }}
                  />
                </div>
              )}
            </div>

            {/* SINGLE PHOTO MODE */}
            {previewMode === "single" && (
              <>
                {/* Photo Viewer Container with overlaid Left/Right navigation buttons */}
                <div style={{ 
                  position: "relative",
                  background: "#080c14", 
                  borderRadius: "14px", 
                  padding: "16px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  minHeight: "440px",
                  userSelect: "none"
                }}>
                  {/* Left Quick Arrow Overlay */}
                  <button 
                    type="button"
                    onClick={handlePrev}
                    style={{ 
                      position: "absolute", 
                      left: "14px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      zIndex: 20, 
                      background: "rgba(15, 23, 42, 0.85)", 
                      border: "1px solid var(--border)", 
                      color: "#ffffff", 
                      width: "42px", 
                      height: "42px", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      transition: "all 0.15s ease"
                    }}
                    title="Previous (← Left Arrow)"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* Main Centered Image Frame */}
                  {previewDataUrl ? (
                    <div style={{ 
                      position: "relative", 
                      maxWidth: "100%", 
                      maxHeight: "460px", 
                      boxShadow: "0 14px 40px rgba(0,0,0,0.7)",
                      borderRadius: "8px",
                      overflow: "hidden",
                      display: "inline-block"
                    }}>
                      <img 
                        src={previewDataUrl} 
                        alt={currentJob?.originalName || "Photo"} 
                        style={{ maxWidth: "100%", maxHeight: "460px", display: "block" }} 
                      />
                      {/* Superimposed Footer Strip (100% Width Auto-Fit) */}
                      <div style={{ 
                        position: "absolute", 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        width: "100%",
                        pointerEvents: "none"
                      }}>
                        <img 
                          src={selectedTemplate.imageUrl} 
                          alt="Footer Banner" 
                          style={{ width: "100%", display: "block" }} 
                        />
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>Loading photo...</span>
                  )}

                  {/* Right Quick Arrow Overlay */}
                  <button 
                    type="button"
                    onClick={handleNext}
                    style={{ 
                      position: "absolute", 
                      right: "14px", 
                      top: "50%", 
                      transform: "translateY(-50%)", 
                      zIndex: 20, 
                      background: "rgba(15, 23, 42, 0.85)", 
                      border: "1px solid var(--border)", 
                      color: "#ffffff", 
                      width: "42px", 
                      height: "42px", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      transition: "all 0.15s ease"
                    }}
                    title="Next (→ Right Arrow)"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Current Photo Details & Fast Scrub Slider */}
                <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      Photo {currentPreviewIndex + 1} of {jobs.length}:
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "6px" }}>
                      {currentJob?.originalName}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", maxWidth: "300px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>1</span>
                    <input 
                      type="range" 
                      min="0" 
                      max={Math.max(0, jobs.length - 1)} 
                      value={currentPreviewIndex} 
                      onChange={(e) => setCurrentPreviewIndex(Number(e.target.value))} 
                      style={{ width: "100%", accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{jobs.length}</span>
                  </div>
                </div>

                {/* Bottom Filmstrip Thumbnails Bar */}
                <div 
                  ref={filmstripRef}
                  style={{ 
                    marginTop: "16px", 
                    display: "flex", 
                    gap: "8px", 
                    overflowX: "auto", 
                    padding: "8px 4px", 
                    background: "rgba(0,0,0,0.3)", 
                    borderRadius: "10px", 
                    border: "1px solid var(--border)",
                    maxHeight: "95px"
                  }}
                >
                  {jobs.map((job, idx) => {
                    const isSelected = idx === currentPreviewIndex;
                    const url = thumbnailUrls[job.id];
                    return (
                      <div 
                        key={job.id}
                        onClick={() => setCurrentPreviewIndex(idx)}
                        style={{ 
                          position: "relative",
                          width: "70px", 
                          height: "65px", 
                          borderRadius: "6px", 
                          overflow: "hidden", 
                          cursor: "pointer", 
                          flexShrink: 0,
                          border: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                          background: "#080c14",
                          boxShadow: isSelected ? "0 0 10px rgba(59, 130, 246, 0.6)" : "none",
                          opacity: isSelected ? 1 : 0.6,
                          transition: "all 0.15s ease"
                        }}
                        title={`Photo ${idx + 1}: ${job.originalName}`}
                      >
                        {url && <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                        {/* Mini footer overlay */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "14px", background: "rgba(11, 21, 40, 0.9)" }}>
                          <img src={selectedTemplate.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <span style={{ position: "absolute", top: "2px", left: "4px", fontSize: "0.65rem", fontWeight: 700, color: "#fff", textShadow: "0 1px 2px #000" }}>
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ALL PHOTOS (GRID VIEW) MODE */}
            {previewMode === "grid" && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
                  Showing all <strong>{filteredJobs.length}</strong> photos with real-time footer overlay. Click any photo to inspect in Single View.
                </p>

                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                  gap: "14px", 
                  maxHeight: "560px", 
                  overflowY: "auto", 
                  paddingRight: "6px" 
                }}>
                  {filteredJobs.map((job) => {
                    const actualIdx = jobs.findIndex(j => j.id === job.id);
                    const url = thumbnailUrls[job.id];
                    return (
                      <div 
                        key={job.id}
                        onClick={() => {
                          setCurrentPreviewIndex(actualIdx);
                          setPreviewMode("single");
                        }}
                        style={{ 
                          position: "relative", 
                          background: "#080c14", 
                          borderRadius: "8px", 
                          overflow: "hidden", 
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                          transition: "transform 0.15s, border-color 0.15s",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.03)";
                          e.currentTarget.style.borderColor = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.borderColor = "var(--border)";
                        }}
                      >
                        <div style={{ height: "140px", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {url ? (
                            <img src={url} alt={job.originalName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Loading...</span>
                          )}

                          {/* Live Overlay Footer on Grid Card */}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%" }}>
                            <img src={selectedTemplate.imageUrl} alt="" style={{ width: "100%", display: "block" }} />
                          </div>

                          <span style={{ 
                            position: "absolute", 
                            top: "6px", 
                            left: "6px", 
                            background: "rgba(0,0,0,0.75)", 
                            color: "#fff", 
                            fontSize: "0.7rem", 
                            fontWeight: 700, 
                            padding: "2px 6px", 
                            borderRadius: "4px" 
                          }}>
                            #{actualIdx + 1}
                          </span>
                        </div>

                        <div style={{ padding: "8px 10px", background: "rgba(17, 24, 39, 0.95)" }}>
                          <p style={{ fontSize: "0.78rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {job.originalName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                Back to Templates
              </button>
              <button className="btn" onClick={startProcessing} style={{ padding: "12px 28px", fontSize: "1rem" }}>
                <Play size={18} /> Start Batch Processing ({jobs.length} Photos)
              </button>
            </div>

          </div>

          {/* Export Settings Card (in Single View) */}
          {previewMode === "single" && (
            <div className="card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} color="var(--accent)" /> Output Settings
              </h3>

              <div className="form-group">
                <label>Output Format</label>
                <select 
                  className="form-control" 
                  value={settings.outputFormat} 
                  onChange={e => setSettings({...settings, outputFormat: e.target.value as any})}
                >
                  <option value="image/jpeg">JPEG (High Quality, Compact)</option>
                  <option value="image/png">PNG (Lossless, Preserves Transparency)</option>
                  <option value="image/webp">WEBP (Ultra Fast & Modern)</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Quality Compression</span>
                  <span style={{ color: "var(--accent)" }}>{Math.round(settings.quality * 100)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.0" 
                  step="0.05"
                  value={settings.quality} 
                  onChange={e => setSettings({...settings, quality: parseFloat(e.target.value)})}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
              </div>

              <div className="form-group">
                <label>Filename Suffix</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={settings.filenameSuffix} 
                  onChange={e => setSettings({...settings, filenameSuffix: e.target.value})}
                  placeholder="_footer" 
                />
              </div>

              <div style={{ padding: "16px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", marginTop: "24px" }}>
                <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "8px" }}>Batch Info</h4>
                <p style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                  • Total Queue: <strong>{jobs.length}</strong> photos
                </p>
                <p style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                  • Active Template: <strong>{selectedTemplate.name}</strong>
                </p>
                <p style={{ fontSize: "0.85rem", color: "var(--success)" }}>
                  • Scale Mode: <strong>100% Proportional Auto-Fit</strong>
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* STEP 4: Processing State */}
      {step === 4 && (
        <div className="card" style={{ textAlign: "center", padding: "80px 32px", marginTop: "20px" }}>
          <div style={{ 
            width: "64px", 
            height: "64px", 
            borderRadius: "50%", 
            background: "rgba(59, 130, 246, 0.15)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 24px",
            color: "var(--accent)"
          }}>
            <Sparkles size={32} />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
            Processing {jobs.length} Images...
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "32px" }}>
            High-speed HTML5 Canvas batch rendering in progress
          </p>

          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ width: "100%", height: "10px", background: "var(--border)", borderRadius: "6px", overflow: "hidden", marginBottom: "12px" }}>
              <div style={{ 
                width: `${progress}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)", 
                transition: "width 0.2s ease-out" 
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>{Math.round((progress / 100) * jobs.length)} of {jobs.length} Done</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Completion & Download */}
      {step === 5 && (
        <div style={{ marginTop: "20px" }}>
          <div className="card" style={{ textAlign: "center", padding: "40px 24px", marginBottom: "24px" }}>
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              background: "rgba(16, 185, 129, 0.15)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--success)"
            }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "8px" }}>Batch Processing Finished!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
              Successfully merged footer onto {jobs.filter(j => j.status === 'completed').length} photos.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
              <button 
                className="btn" 
                onClick={() => downloadZip(jobs, `bulk_processed_${Date.now()}.zip`)}
                style={{ padding: "12px 28px", fontSize: "1rem" }}
              >
                <Download size={20} /> Download All as ZIP
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setJobs([]);
                  setStep(1);
                }}
              >
                <RotateCcw size={18} /> Process More Photos
              </button>
            </div>
          </div>

          {/* Result Grid with individual downloads */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {jobs.map((job) => (
              <div key={job.id} className="card" style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
                <div style={{ 
                  height: "180px", 
                  borderRadius: "8px", 
                  overflow: "hidden", 
                  background: "#080c14", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  marginBottom: "12px"
                }}>
                  {job.outputUrl ? (
                    <img src={job.outputUrl} alt={job.originalName} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}>Failed</span>
                  )}
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {job.originalName}
                  </p>
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: job.status === 'completed' ? 'var(--success)' : 'var(--danger)',
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    ● {job.status}
                  </span>
                </div>

                {job.outputUrl && (
                  <a 
                    href={job.outputUrl} 
                    download={`${job.originalName.replace(/\.[^/.]+$/, "")}${settings.filenameSuffix}.${settings.outputFormat.split('/')[1]}`}
                    className="btn btn-secondary" 
                    style={{ width: "100%", fontSize: "0.85rem", padding: "8px", marginTop: "auto" }}
                  >
                    <Download size={14} /> Download Single
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
