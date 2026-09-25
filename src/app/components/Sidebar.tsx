"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Image as ImageIcon, LayoutTemplate, FolderOpen, Settings, Sparkles } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/upload", label: "Bulk Generator", icon: Sparkles },
    { href: "/templates", label: "Footer Templates", icon: LayoutTemplate },
    { href: "/projects", label: "Past Projects", icon: FolderOpen },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff"
        }}>
          <Sparkles size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Bulk Footer</h2>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Auto-Fit Pro Overlay</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive ? "active" : ""}`}
              style={{
                background: isActive ? "rgba(59, 130, 246, 0.15)" : undefined,
                color: isActive ? "#60a5fa" : undefined,
                fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ 
          padding: "12px", 
          borderRadius: "8px", 
          background: "rgba(0,0,0,0.2)", 
          fontSize: "0.75rem", 
          color: "var(--text-muted)" 
        }}>
          <span style={{ color: "var(--success)", fontWeight: 600 }}>● Engine: Active</span>
          <p style={{ marginTop: "4px" }}>HTML5 Canvas High-Res</p>
        </div>
      </div>
    </aside>
  );
}
