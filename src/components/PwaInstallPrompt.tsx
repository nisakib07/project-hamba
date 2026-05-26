"use client";

import { useEffect, useState } from "react";

export default function PwaInstallPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 24px)",
        maxWidth: "420px",
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #1a2332 0%, #0f172a 100%)",
          border: "1px solid #1e3a5f",
          borderRadius: "16px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#f1f5f9",
            }}
          >
            📲 অ্যাপ ইনস্টল করুন
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "0.75rem",
              color: "#94a3b8",
            }}
          >
            হোম স্ক্রিনে যোগ করুন, সহজে ব্যবহার করুন
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => setShowInstall(false)}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "6px 14px",
              fontSize: "0.8rem",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            পরে
          </button>
          <button
            onClick={handleInstallClick}
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              border: "none",
              borderRadius: "10px",
              padding: "6px 14px",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            ইনস্টল
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
