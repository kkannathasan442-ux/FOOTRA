"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getTemplates, deleteTemplate } from "@/lib/db";
import { FooterTemplate } from "@/lib/types";
import { Plus, Trash2, LayoutTemplate, Layers, ArrowRight } from "lucide-react";

export default function Templates() {
  const [templates, setTemplates] = useState<FooterTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const t = await getTemplates();
    setTemplates(t);
    setLoading(false);
  }

  async function remove(id: string) {
    if (confirm("Are you sure you want to delete this footer template?")) {
      await deleteTemplate(id);
      load();
    }
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "60px" }}>
      <div className="header-flex">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Footer Templates</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Saved footer designs that automatically fit and scale onto any image size.
          </p>
        </div>
        <Link href="/templates/new" className="btn">
          <Plus size={18} /> New Footer Template
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)" }}>
          Loading templates...
        </div>
      ) : (
        <div className="grid-3" style={{ marginTop: "20px" }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ 
                  height: "140px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  background: "radial-gradient(circle, #1e293b 0%, #0b0f19 100%)", 
                  borderRadius: "8px", 
                  marginBottom: "16px", 
                  padding: "12px",
                  border: "1px solid var(--border)"
                }}>
                  <img src={t.imageUrl} alt={t.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                
                <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>{t.name}</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                  <div>
                    <strong>Scaling: </strong> 
                    <span style={{ color: "var(--text-main)" }}>
                      {t.defaultHeightMode === 'ratio' ? 'Auto Width Fit (100%)' : `${t.defaultHeightMode} (${t.defaultHeightValue})`}
                    </span>
                  </div>
                  <div>
                    <strong>Position: </strong> 
                    <span style={{ color: "var(--text-main)" }}>{t.position}</span>
                  </div>
                  <div>
                    <strong>Original Size: </strong> 
                    <span>{t.width} × {t.height} px</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => remove(t.id)} 
                  style={{ color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)", padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <Link 
                  href="/upload" 
                  className="btn" 
                  style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                >
                  Use Template <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "64px 24px", color: "var(--text-muted)", border: "2px dashed var(--border)", borderRadius: "16px" }}>
              <LayoutTemplate size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Templates Created Yet</h3>
              <p style={{ maxWidth: "450px", margin: "0 auto 24px" }}>
                Upload your tournament, club, or sponsor footer PNG once and reuse it across hundreds of photos.
              </p>
              <Link href="/templates/new" className="btn">
                <Plus size={18} /> Upload Your First Footer PNG
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
