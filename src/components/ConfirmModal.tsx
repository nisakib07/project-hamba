"use client";

import { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  confirmColor?: "danger" | "primary";
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "নিশ্চিত",
  confirmColor = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <h3 className="modal-title">{title}</h3>
        <div style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {children}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            বাতিল
          </button>
          <button
            className={`btn ${confirmColor === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "প্রক্রিয়াকরণ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
