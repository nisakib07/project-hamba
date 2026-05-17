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
        toast.success("Batch created successfully!");
        router.push(`/batches/${json.data._id}`);
      } else {
        toast.error(json.error || "Failed to create batch");
      }
    } catch {
      toast.error("Network error");
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
          Back to Batches
        </Link>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "0.35rem",
          }}
        >
          Create New Batch
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Register a new cow purchase and slaughter batch
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
            🐄 Basic Information
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Batch Name *</label>
              <input
                type="text"
                name="batchName"
                className="form-input"
                placeholder="e.g., Cow #12 - Dhaka Market"
                value={form.batchName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Purchase Date *</label>
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
              <label className="form-label">Total Meat (kg)</label>
              <input
                type="number"
                name="totalMeatKg"
                className="form-input"
                placeholder="Total meat weight"
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
            💰 Costs & Expenses
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Buying Cost (৳) *</label>
              <input
                type="number"
                name="buyingCost"
                className="form-input"
                placeholder="Cow purchase price"
                value={form.buyingCost}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Food Cost (৳)</label>
              <input
                type="number"
                name="foodCost"
                className="form-input"
                placeholder="Feed expenses"
                value={form.foodCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Butcher Cost (৳)</label>
              <input
                type="number"
                name="butcherCost"
                className="form-input"
                placeholder="Slaughter fees"
                value={form.butcherCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Transport Cost (৳)</label>
              <input
                type="number"
                name="transportCost"
                className="form-input"
                placeholder="Transport fees"
                value={form.transportCost}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Other Expenses (৳)</label>
              <input
                type="number"
                name="otherExpenses"
                className="form-input"
                placeholder="Any other expenses"
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
            🏷️ Meat Pricing
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Base Meat Price/kg (৳) *</label>
              <input
                type="number"
                name="baseMeatPricePerKg"
                className="form-input"
                placeholder="Default selling price per kg"
                value={form.baseMeatPricePerKg}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
            💡 Byproduct sales (chamra, vuri, pa) can be added from the Byproducts tab after creating the batch.
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
            📝 Notes
          </h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              name="notes"
              className="form-input"
              placeholder="Optional notes about this batch..."
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
            {submitting ? "Creating..." : "🐄 Create Batch"}
          </button>
          <Link href="/batches" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
