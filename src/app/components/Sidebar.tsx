"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LayoutTemplate, FolderOpen, Settings, Sparkles } from "lucide-react";

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
      {/* Brand Header */}
      <Link href="/" className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
        <img 
          src="/icon.svg" 
          alt="FOOTRA Logo" 
          style={{ width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0 }} 
        />
        <div style={{ overflow: "hidden" }}>
          <h2 style={{ 
            fontSize: "1.25rem", 
            fontWeight: 900, 
            letterSpacing: "0.08em", 
            color: "#ffffff",
            lineHeight: 1.1,
            textTransform: "uppercase"
          }}>
            FOOTRA
          </h2>
          <span style={{ 
            fontSize: "0.68rem", 
            color: "var(--text-muted)", 
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Create Once. Apply Everywhere.
          </span>
        </div>
      </Link>

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
          <span style={{ color: "var(--success)", fontWeight: 600 }}>● FOOTRA Engine v1.0</span>
          <p style={{ marginTop: "4px" }}>Auto-Fit Proportional Scale</p>
        </div>
      </div>
    </aside>
  );
}
