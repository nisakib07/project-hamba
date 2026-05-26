"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HiOutlineRefresh, HiOutlineHome } from "react-icons/hi";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global app error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        padding: "2rem",
        textAlign: "center",
      }}
      className="animate-fade-in"
    >
      <div
        className="glass-card"
        style={{
          padding: "3rem 2rem",
          maxWidth: "480px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--accent-red)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: "bold",
          }}
        >
          !
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          দুঃখিত, কোনো একটি সমস্যা হয়েছে!
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          অ্যাপ্লিকেশনটি লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।
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
            style={{ flex: 1, gap: "0.5rem" }}
          >
            <HiOutlineRefresh size={18} />
            আবার চেষ্টা করুন
          </button>

          <Link
            href="/"
            className="btn btn-secondary"
            style={{ flex: 1, gap: "0.5rem" }}
          >
            <HiOutlineHome size={18} />
            ড্যাশবোর্ড
          </Link>
        </div>
      </div>
    </div>
  );
}
