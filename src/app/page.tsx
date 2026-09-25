"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, LayoutTemplate, Image as ImageIcon, Plus, Sparkles, Layers, ArrowRight, Zap, CheckCircle } from "lucide-react";
import { getProjects, getTemplates } from "@/lib/db";
import { Project, FooterTemplate } from "@/lib/types";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<FooterTemplate[]>([]);

  useEffect(() => {
    async function load() {
      const p = await getProjects();
      const t = await getTemplates();
      setProjects(p);
      setTemplates(t);
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Hero Action Banner */}
      <div style={{ 
        background: "linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        borderRadius: "16px",
        padding: "36px 32px",
        marginBottom: "36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "24px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
      }}>
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <img src="/icon.svg" alt="FOOTRA" style={{ width: "54px", height: "54px", borderRadius: "14px" }} />
            <div>
              <h1 style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "0.06em", lineHeight: 1 }}>
                FOOTRA
              </h1>
              <p style={{ color: "#93c5fd", fontSize: "0.95rem", fontWeight: 500, marginTop: "4px" }}>
                Create Once. Apply Everywhere.
              </p>
            </div>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Upload your tournament, event, or branding footer PNG once. Automatically scale and overlay it across any photo size, orientation, or resolution in seconds.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "220px" }}>
          <Link href="/upload" className="btn" style={{ padding: "14px 24px", fontSize: "1rem", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)" }}>
            <Sparkles size={18} /> Start Bulk Process
          </Link>
          <Link href="/templates/new" className="btn btn-secondary" style={{ padding: "10px 20px", fontSize: "0.9rem" }}>
            <Plus size={16} /> New Footer Template
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ marginBottom: "36px" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "14px", background: "rgba(59, 130, 246, 0.12)", borderRadius: "12px", color: "var(--accent)" }}>
              <FolderOpen size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{projects.length}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Total Bulk Jobs</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "14px", background: "rgba(16, 185, 129, 0.12)", borderRadius: "12px", color: "var(--success)" }}>
              <ImageIcon size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{projects.reduce((acc, p) => acc + p.imageCount, 0).toLocaleString()}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Images Processed</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ padding: "14px", background: "rgba(245, 158, 11, 0.12)", borderRadius: "12px", color: "var(--warning)" }}>
              <LayoutTemplate size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{templates.length}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Saved Footer Designs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates Shelf */}
      {templates.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <div className="header-flex">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Your Footer Templates</h2>
            <Link href="/templates" style={{ color: "var(--accent)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {templates.slice(0, 3).map((t) => (
              <div key={t.id} className="card" style={{ padding: "14px", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "90px", background: "#0b0f19", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", marginBottom: "12px" }}>
                  <img src={t.imageUrl} alt={t.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>{t.name}</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "12px" }}>Auto 100% Width Fit</p>
                <Link href="/upload" className="btn btn-secondary" style={{ width: "100%", padding: "6px", fontSize: "0.8rem", marginTop: "auto" }}>
                  Use in Batch
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects Table */}
      <div>
        <div className="header-flex">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Recent Activity</h2>
          {projects.length > 0 && (
            <Link href="/projects" style={{ color: "var(--accent)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
              View All Projects <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <FolderOpen size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: "0.95rem", marginBottom: "16px" }}>No projects processed yet.</p>
              <Link href="/upload" className="btn">
                <Sparkles size={16} /> Process Your First Batch
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Project Name</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Photos</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: "14px 16px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "0.85rem" }}>{p.imageCount} images</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "4px", 
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: p.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: p.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                      }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
