import Link from "next/link";
import { HiOutlineHome } from "react-icons/hi";

export default function NotFound() {
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
            fontSize: "4rem",
            fontWeight: 800,
            color: "var(--accent-green)",
            lineHeight: 1,
          }}
        >
          ৪০৪
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          পেজটি খুঁজে পাওয়া যায়নি
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          আপনি যে পেজটি খুঁজছেন তা সম্ভবত মুছে ফেলা হয়েছে অথবা লিংকটি ভুল ছিল। ড্যাশবোর্ডে ফিরে যেতে নিচের বাটনে ক্লিক করুন।
        </p>

        <Link
          href="/"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "0.5rem", gap: "0.5rem" }}
        >
          <HiOutlineHome size={18} />
          ড্যাশবোর্ডে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
