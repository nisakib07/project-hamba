"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiOutlineArrowLeft } from "react-icons/hi";
import Link from "next/link";

export default function NewBatchPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    batchName: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    buyingCost: "",
    foodCost: "",
    butcherCost: "",
    transportCost: "",
    otherExpenses: "",
    baseMeatPricePerKg: "",
    totalMeatKg: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      batchName: form.batchName,
      purchaseDate: form.purchaseDate,
      buyingCost: Number(form.buyingCost) || 0,
      foodCost: Number(form.foodCost) || 0,
      butcherCost: Number(form.butcherCost) || 0,
      transportCost: Number(form.transportCost) || 0,
      otherExpenses: Number(form.otherExpenses) || 0,
      baseMeatPricePerKg: Number(form.baseMeatPricePerKg) || 0,
      totalMeatKg: Number(form.totalMeatKg) || 0,
      notes: form.notes,
    };

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("ব্যাচ সফলভাবে তৈরি হয়েছে!");
        router.push(`/batches/${json.data._id}`);
      } else {
        toast.error(json.error || "ব্যাচ তৈরি করতে সমস্যা হয়েছে");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/batches"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "0.75rem",
          }}
        >
          <HiOutlineArrowLeft size={16} />
          ব্যাচ সমূহে ফিরুন
        </Link>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "0.35rem",
          }}
        >
          নতুন ব্যাচ তৈরি করুন
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          নতুন গরু ক্রয় ও জবাইয়ের ব্যাচ নিবন্ধন করুন
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div
          className="glass-card"
          style={{ padding: "1.5rem", marginBottom: "1.25rem" }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--accent-green)",
            }}
          >
            🐄 মৌলিক তথ্য
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">ব্যাচের নাম *</label>
              <input
                type="text"
                name="batchName"
                className="form-input"
                placeholder="যেমন: গরু #১২ - ঢাকা বাজার"
                value={form.batchName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">জবাইয়ের তারিখ *</label>
              <input
                type="date"
                name="purchaseDate"
                className="form-input"
                value={form.purchaseDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">মোট গোশত (কেজি)</label>
              <input
                type="number"
                name="totalMeatKg"
                className="form-input"
                placeholder="মোট গোশতের ওজন"
                value={form.totalMeatKg}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Costs */}
        <div
          className="glass-card"
          style={{ padding: "1.5rem", marginBottom: "1.25rem" }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--accent-blue)",
            }}
          >
            💰 খরচ সমূহ
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">ক্রয়মূল্য (৳) *</label>
              <input
                type="number"
                name="buyingCost"
                className="form-input"
                placeholder="গরু কেনার দাম"
                value={form.buyingCost}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">খাবার খরচ (৳)</label>
              <input
                type="number"
                name="foodCost"
                className="form-input"
                placeholder="খাদ্য খরচ"
                value={form.foodCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">কসাই খরচ (৳)</label>
              <input
                type="number"
                name="butcherCost"
                className="form-input"
                placeholder="জবাই খরচ"
                value={form.butcherCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">পরিবহন খরচ (৳)</label>
              <input
                type="number"
                name="transportCost"
                className="form-input"
                placeholder="পরিবহন ভাড়া"
                value={form.transportCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">অন্যান্য খরচ (৳)</label>
              <input
                type="number"
                name="otherExpenses"
                className="form-input"
                placeholder="অন্য কোনো খরচ"
                value={form.otherExpenses}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div
          className="glass-card"
          style={{ padding: "1.5rem", marginBottom: "1.25rem" }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--accent-purple)",
            }}
          >
            🏷️ গোশতের দাম
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">প্রতি কেজি মাংসের দাম (৳) *</label>
              <input
                type="number"
                name="baseMeatPricePerKg"
                className="form-input"
                placeholder="প্রতি কেজি বিক্রয় মূল্য"
                value={form.baseMeatPricePerKg}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            💡 চামড়া, ভুঁড়ি, পা ইত্যাদির বিক্রি ব্যাচ তৈরির পরে যোগ করতে পারবেন।
          </p>
        </div>

        {/* Notes */}
        <div
          className="glass-card"
          style={{ padding: "1.5rem", marginBottom: "1.5rem" }}
        >
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
              color: "var(--accent-yellow)",
            }}
          >
            📝 নোট
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              name="notes"
              className="form-input"
              placeholder="এই ব্যাচ সম্পর্কে কোনো নোট (ঐচ্ছিক)..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ flex: 1 }}
          >
            {submitting ? "তৈরি হচ্ছে..." : "🐄 ব্যাচ তৈরি করুন"}
          </button>
          <Link href="/batches" className="btn btn-secondary">
            বাতিল
          </Link>
        </div>
      </form>
    </div>
  );
}
