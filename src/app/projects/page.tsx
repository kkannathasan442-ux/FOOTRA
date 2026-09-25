"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Calendar, Image as ImageIcon, Trash2, Plus, ArrowRight } from "lucide-react";
import { getProjects, saveProject, deleteJobsForProject } from "@/lib/db";
import { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const p = await getProjects();
    setProjects(p.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "60px" }}>
      <div className="header-flex">
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Past Projects</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            View and manage your bulk processing history.
          </p>
        </div>
        <Link href="/upload" className="btn">
          <Plus size={18} /> New Bulk Job
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)" }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <FolderOpen size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>No Projects Found</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            Start by uploading photos and applying a footer banner.
          </p>
          <Link href="/upload" className="btn">
            Create First Project
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {projects.map((proj) => (
            <div key={proj.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{proj.name}</h3>
                  <span style={{ 
                    padding: "4px 8px", 
                    borderRadius: "6px", 
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: proj.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: proj.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {proj.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} />
                    <span>{new Date(proj.createdAt).toLocaleDateString()} at {new Date(proj.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ImageIcon size={14} />
                    <span>{proj.completedCount} / {proj.imageCount} Photos Processed</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <Link href={`/upload`} className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "6px 12px" }}>
                  Run Similar Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
