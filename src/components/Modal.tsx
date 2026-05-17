"use client";

import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{title}</h3>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ fontSize: "1.2rem" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
