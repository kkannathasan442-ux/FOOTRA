"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveTemplate } from "@/lib/db";
import { FooterTemplate, FitMode, Position } from "@/lib/types";
import { UploadCloud, CheckCircle, Sliders, Image as ImageIcon, Eye, ArrowLeft, Save, Sparkles } from "lucide-react";
import Link from "next/link";

export default function NewTemplate() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [fitMode, setFitMode] = useState<FitMode>("ratio");
  const [fitValue, setFitValue] = useState(10);
  const [position, setPosition] = useState<Position>("overlay-bottom");
  const [opacity, setOpacity] = useState(100);
  const [previewOrientation, setPreviewOrientation] = useState<"landscape" | "portrait" | "square">("landscape");
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file) return;
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImageUrl(dataUrl);
        setImgWidth(img.naturalWidth || img.width || 1200);
        setImgHeight(img.naturalHeight || img.height || 140);
        setName(prev => prev || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        setIsLoading(false);
      };
      img.onerror = () => {
        alert("Failed to load image. Please select a valid PNG or JPG file.");
        setIsLoading(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      alert("Error reading file.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // Generate a sample tournament banner for instant demo
  const loadSampleCricketBanner = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark tournament strip gradient
    const grad = ctx.createLinearGradient(0, 0, 1600, 0);
    grad.addColorStop(0, "#0b1528");
    grad.addColorStop(0.5, "#172554");
    grad.addColorStop(1, "#0b1528");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1600, 160);

    // Golden accent border on top
    ctx.fillStyle = "#eab308";
    ctx.fillRect(0, 0, 1600, 6);

    // Left Title
    ctx.font = "italic bold 34px sans-serif";
    ctx.fillStyle = "#facc15";
    ctx.fillText("Let's Play!", 50, 95);

    // Center Tournament Name
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("CApps Cricket Fiesta - 2026", 800, 100);

    // Right Team/Sponsors
    ctx.font = "600 28px sans-serif";
    ctx.fillStyle = "#60a5fa";
    ctx.textAlign = "right";
    ctx.fillText("PRIME XI  •  RISING TITANS  •  ROYAL STRIKERS", 1550, 95);

    const dataUrl = canvas.toDataURL("image/png");
    setImageUrl(dataUrl);
    setImgWidth(1600);
    setImgHeight(160);
    setName("CApps Cricket Fiesta 2026");
  };

  const handleSave = async () => {
    if (!name.trim() || !imageUrl) return alert("Please enter a template name and upload a footer image.");
    
    setIsLoading(true);
    try {
      let finalImageUrl = imageUrl;
      
      // If the image is a base64 string (newly uploaded or generated), upload it to Cloudinary directly
      if (imageUrl.startsWith('data:image')) {
        const formData = new FormData();
        formData.append('file', imageUrl);
        formData.append('upload_preset', 'footra'); // The unsigned preset provided by user

        const res = await fetch('https://api.cloudinary.com/v1_1/dctiqhzyc/image/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
        finalImageUrl = data.secure_url;
      }

      const template: FooterTemplate = {
        id: crypto.randomUUID(),
        name: name.trim(),
        imageUrl: finalImageUrl,
        width: imgWidth || 1200,
        height: imgHeight || 120,
        aspectRatio: imgWidth && imgHeight ? imgWidth / imgHeight : 10,
        defaultHeightMode: fitMode,
        defaultHeightValue: fitValue,
        position,
        opacity: opacity / 100,
        safeArea: { left: 0, right: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveTemplate(template);
      router.push("/templates");
    } catch (err: any) {
      console.error(err);
      alert("Error saving: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleDimensions = {
    landscape: { width: 800, height: 450, label: "Landscape (16:9)" },
    portrait: { width: 450, height: 600, label: "Portrait (3:4)" },
    square: { width: 500, height: 500, label: "Square (1:1)" }
  };

  const currentSample = sampleDimensions[previewOrientation];
  const isOverlay = position.startsWith("overlay");
  const isTop = position.includes("top");

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Link href="/templates" className="btn btn-secondary" style={{ padding: "8px 12px" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Create Footer Template</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Upload your transparent PNG footer/banner and configure auto-fit settings.
          </p>
        </div>
      </div>

      {!imageUrl ? (
        <div className="card" style={{ padding: "40px 24px" }}>
          <label 
            htmlFor="template-file-picker"
            className="dropzone" 
            onDrop={(e) => { 
              e.preventDefault(); 
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); 
            }}
            onDragOver={(e) => e.preventDefault()}
            style={{ maxWidth: "600px", margin: "0 auto", borderStyle: "dashed", borderWidth: "2px", display: "block", cursor: "pointer" }}
          >
            <div style={{ 
              width: "64px", 
              height: "64px", 
              borderRadius: "50%", 
              background: "rgba(59, 130, 246, 0.15)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--accent)"
            }}>
              <UploadCloud size={32} />
            </div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
              {isLoading ? "Loading image..." : "Upload Footer Banner (PNG)"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
              Upload transparent PNG or JPEG banner with logos, tournament titles, or sponsors.
            </p>
            <span className="btn" style={{ display: "inline-flex", pointerEvents: "none", padding: "10px 24px" }}>
              Browse Computer
            </span>
            <input 
              id="template-file-picker"
              type="file" 
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*" 
              style={{ display: "none" }} 
              onChange={(e) => { 
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0]); 
                }
              }}
            />
          </label>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>or want to quickly test?</span>
            <div style={{ marginTop: "8px" }}>
              <button 
                type="button" 
                onClick={loadSampleCricketBanner} 
                className="btn btn-secondary" 
                style={{ fontSize: "0.85rem", padding: "6px 14px" }}
              >
                <Sparkles size={14} color="#facc15" /> Load Cricket Fiesta 2026 Sample Banner
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          {/* Settings Column */}
          <div className="card">
            <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={20} color="var(--accent)" /> Template Configuration
            </h3>

            <div className="form-group">
              <label>Template Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. CApps Cricket Fiesta 2026" 
              />
            </div>

            <div className="form-group">
              <label>Position Mode</label>
              <select className="form-control" value={position} onChange={e => setPosition(e.target.value as Position)}>
                <option value="overlay-bottom">Overlay Bottom (Recommended - on top of photo bottom)</option>
                <option value="bottom">Append Bottom (Expands canvas height at bottom)</option>
                <option value="overlay-top">Overlay Top (Header on photo top)</option>
                <option value="top">Append Top (Expands canvas height at top)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Auto-Fit Scaling Logic</label>
              <select className="form-control" value={fitMode} onChange={e => setFitMode(e.target.value as FitMode)}>
                <option value="ratio">Auto 100% Width Fit (Maintains Natural Footer Aspect Ratio)</option>
                <option value="percentage">Fixed % of Photo Height</option>
                <option value="fixed">Fixed Pixel Height</option>
              </select>
              <small style={{ color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                {fitMode === 'ratio' 
                  ? '✨ Automatically stretches footer to 100% image width and scales height smoothly.' 
                  : 'Scales based on a specified fraction of the image height.'}
              </small>
            </div>

            {fitMode !== 'ratio' && (
              <div className="form-group">
                <label>Height Value ({fitMode === 'percentage' ? '% of image height' : 'px'})</label>
                <input 
                  type="number" 
                  min="1" 
                  max={fitMode === 'percentage' ? 50 : 1000} 
                  className="form-control" 
                  value={fitValue} 
                  onChange={e => setFitValue(Number(e.target.value))} 
                />
              </div>
            )}

            <div className="form-group">
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Footer Opacity</span>
                <span style={{ color: "var(--accent)" }}>{opacity}%</span>
              </label>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={opacity} 
                onChange={e => setOpacity(Number(e.target.value))} 
                style={{ width: "100%", accentColor: "var(--accent)" }}
              />
            </div>

            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Footer Dimensions:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{imgWidth} × {imgHeight} px</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Aspect Ratio:</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{(imgWidth / (imgHeight || 1)).toFixed(2)} : 1</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button className="btn btn-secondary" onClick={() => setImageUrl("")} style={{ flex: 1 }}>
                Change Image
              </button>
              <button className="btn" onClick={handleSave} style={{ flex: 2 }}>
                <Save size={18} /> Save Template
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Eye size={20} color="var(--success)" /> Live Simulation Preview
              </h3>
              <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.3)", padding: "4px", borderRadius: "8px" }}>
                {(["landscape", "portrait", "square"] as const).map((orient) => (
                  <button 
                    key={orient}
                    type="button"
                    onClick={() => setPreviewOrientation(orient)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      background: previewOrientation === orient ? "var(--accent)" : "transparent",
                      color: previewOrientation === orient ? "#fff" : "var(--text-muted)",
                      fontWeight: 500
                    }}
                  >
                    {orient.charAt(0).toUpperCase() + orient.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
              See how your footer automatically aligns on a sample <strong>{currentSample.label}</strong> photo:
            </p>

            {/* Visual Canvas Simulation Frame */}
            <div style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              background: "#090d16", 
              borderRadius: "12px", 
              padding: "20px",
              minHeight: "350px",
              overflow: "hidden"
            }}>
              <div style={{ 
                position: "relative",
                width: previewOrientation === "portrait" ? "240px" : previewOrientation === "square" ? "280px" : "380px",
                height: isOverlay 
                  ? (previewOrientation === "portrait" ? "320px" : previewOrientation === "square" ? "280px" : "214px")
                  : (previewOrientation === "portrait" ? "360px" : previewOrientation === "square" ? "320px" : "250px"),
                background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
                borderRadius: "8px",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                justifyContent: isTop ? "flex-start" : "flex-end"
              }}>
                {/* Mock Sample photo background content */}
                <div style={{ 
                  position: "absolute", 
                  inset: 0, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.2)",
                  pointerEvents: "none"
                }}>
                  <ImageIcon size={48} />
                  <span style={{ fontSize: "0.85rem", marginTop: "8px", color: "rgba(255,255,255,0.4)" }}>
                    Mock Photo ({previewOrientation})
                  </span>
                </div>

                {/* Footer preview banner */}
                <div style={{
                  position: isOverlay ? "absolute" : "relative",
                  left: 0,
                  right: 0,
                  top: isTop ? 0 : "auto",
                  bottom: !isTop ? 0 : "auto",
                  width: "100%",
                  opacity: opacity / 100,
                  zIndex: 10
                }}>
                  <img 
                    src={imageUrl} 
                    alt="Footer overlay" 
                    style={{ 
                      width: "100%", 
                      display: "block",
                      height: fitMode === "percentage" ? `${fitValue * 2}px` : "auto"
                    }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--success)", fontSize: "0.85rem" }}>
              <CheckCircle size={16} /> Footer stretches cleanly across the full bottom width of any image size.
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
