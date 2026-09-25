"use client";
import { useState } from "react";
import { Settings, Save, CheckCircle, Sliders, Shield, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const [defaultFormat, setDefaultFormat] = useState("image/jpeg");
  const [defaultQuality, setDefaultQuality] = useState(90);
  const [defaultSuffix, setDefaultSuffix] = useState("_footer");
  const [autoSaveTemplates, setAutoSaveTemplates] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "60px" }}>
      <div className="header-flex">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Application Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Configure default processing options and memory preferences.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Sliders size={20} color="var(--accent)" /> Default Export Preferences
        </h3>

        <div className="form-group">
          <label>Default Output Format</label>
          <select 
            className="form-control" 
            value={defaultFormat} 
            onChange={e => setDefaultFormat(e.target.value)}
          >
            <option value="image/jpeg">JPEG (Compressed, Best for Web/Sharing)</option>
            <option value="image/png">PNG (Lossless, Transparent)</option>
            <option value="image/webp">WEBP (Modern Web Standard)</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Default JPEG/WEBP Quality</span>
            <span style={{ color: "var(--accent)" }}>{defaultQuality}%</span>
          </label>
          <input 
            type="range" 
            min="50" 
            max="100" 
            value={defaultQuality} 
            onChange={e => setDefaultQuality(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
        </div>

        <div className="form-group">
          <label>Default Filename Suffix</label>
          <input 
            type="text" 
            className="form-control" 
            value={defaultSuffix} 
            onChange={e => setDefaultSuffix(e.target.value)}
            placeholder="_footer"
          />
          <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Appended to original filename (e.g. photo1.jpg → photo1_footer.jpg)
          </small>
        </div>

        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <HardDrive size={20} color="var(--warning)" /> Client Storage & Privacy
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
            All image processing happens 100% locally in your web browser via HTML5 Canvas. No photos or designs are sent to any external server.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          {saved && (
            <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem" }}>
              <CheckCircle size={16} /> Settings saved successfully!
            </span>
          )}
          <button className="btn" onClick={handleSave} style={{ marginLeft: "auto" }}>
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
