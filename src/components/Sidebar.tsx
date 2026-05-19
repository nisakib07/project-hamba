"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineHome,
  HiOutlineCollection,
  HiOutlinePlusCircle,
  HiOutlineMenu,
  HiOutlineX,
} from "react-icons/hi";
import { GiCow } from "react-icons/gi";

const navItems = [
  { href: "/", label: "ড্যাশবোর্ড", icon: HiOutlineHome },
  { href: "/batches", label: "ব্যাচ সমূহ", icon: HiOutlineCollection },
  { href: "/batches/new", label: "নতুন ব্যাচ", icon: HiOutlinePlusCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar no-print" style={{ display: "none" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text-primary)", fontWeight: 700 }}>
          <GiCow size={22} style={{ color: "var(--accent-green)" }} />
          গরু ব্যাচ
        </Link>
        <button className="btn-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 39,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div
          style={{
            padding: "1.5rem 1.25rem",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--gradient-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
              }}
            >
              <GiCow />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                গরু ব্যাচ
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                লাভ ম্যানেজার
              </div>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: "1rem 0", flex: 1 }}>
          <div
            style={{
              padding: "0 1.25rem",
              marginBottom: "0.5rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            মেনু
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/batches" && pathname.match(/^\/batches\/[a-f0-9]+$/i) !== null);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--border-color)",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          <div>গরু ব্যাচ লাভ ম্যানেজার</div>
          <div style={{ marginTop: "0.25rem", opacity: 0.7 }}>v1.0.0</div>
        </div>
      </aside>

      <style jsx>{`
        /* Mobile top bar hidden - replaced by BottomNav */
      `}</style>
    </>
  );
}
