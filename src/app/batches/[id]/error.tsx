"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HiOutlineRefresh, HiOutlineChevronLeft } from "react-icons/hi";

export default function BatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Batch page error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "2rem",
        textAlign: "center",
      }}
      className="animate-fade-in"
    >
      <div
        className="glass-card"
        style={{
          padding: "2.5rem 2rem",
          maxWidth: "480px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--accent-red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            fontWeight: "bold",
          }}
        >
          !
        </div>

        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          ব্যাচের তথ্য লোড করা যায়নি
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            lineHeight: 1.55,
          }}
        >
          সার্ভারের সাথে যোগাযোগের কারণে অথবা অবৈধ আইডি প্রদানের ফলে ব্যাচের তথ্য পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা ব্যাচ তালিকায় ফিরে যান।
        </p>

        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "0.75rem",
              width: "100%",
              textAlign: "left",
              fontSize: "0.8rem",
              fontFamily: "monospace",
              color: "var(--accent-red-light)",
              overflowX: "auto",
            }}
          >
            {error.message || "Unknown error"}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            width: "100%",
            marginTop: "0.5rem",
          }}
        >
          <button
            onClick={() => reset()}
            className="btn btn-primary"
            style={{ flex: 1, gap: "0.4rem" }}
          >
            <HiOutlineRefresh size={18} />
            আবার চেষ্টা করুন
          </button>

          <Link
            href="/batches"
            className="btn btn-secondary"
            style={{ flex: 1, gap: "0.4rem" }}
          >
            <HiOutlineChevronLeft size={18} />
            তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
