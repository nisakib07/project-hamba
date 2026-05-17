"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineArrowRight,
  HiOutlineTrash,
} from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import toast from "react-hot-toast";

interface Batch {
  _id: string;
  batchName: string;
  purchaseDate: string;
  buyingCost: number;
  status: string;
  baseMeatPricePerKg: number;
  totalMeatKg: number;
  createdAt: string;
}

function formatCurrency(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function BatchListPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      const json = await res.json();
      if (json.success) setBatches(json.data);
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const deleteBatch = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will delete all associated sales and expenses.`))
      return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(`Deleted "${name}"`);
        setBatches((prev) => prev.filter((b) => b._id !== id));
      }
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  const filtered = batches.filter((b) => {
    const matchesSearch = b.batchName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.35rem" }}>
            Cow Batches
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Manage all your cow purchase and slaughter batches
          </p>
        </div>
        <Link href="/batches/new" className="btn btn-primary">
          <HiOutlinePlusCircle size={18} />
          New Batch
        </Link>
      </div>

      {/* Filters */}
      <div
        className="glass-card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <HiOutlineSearch
            size={18}
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search batches..."
            className="form-input"
            style={{ paddingLeft: "2.5rem" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          style={{ maxWidth: 160 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Batch List */}
      {filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🐄</div>
            <div className="empty-state-title">
              {batches.length === 0 ? "No batches yet" : "No results found"}
            </div>
            <div className="empty-state-text">
              {batches.length === 0
                ? "Create your first cow batch to start tracking profits"
                : "Try adjusting your search or filters"}
            </div>
            {batches.length === 0 && (
              <Link
                href="/batches/new"
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Create First Batch
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1rem",
          }}
        >
          {filtered.map((batch) => (
            <div
              key={batch._id}
              className="glass-card"
              style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {batch.batchName}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {new Date(batch.purchaseDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <span
                  className={`badge ${
                    batch.status === "active" ? "badge-green" : "badge-blue"
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    padding: "0.6rem 0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Buying Cost
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {formatCurrency(batch.buyingCost)}
                  </div>
                </div>
                <div
                  style={{
                    padding: "0.6rem 0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.2rem",
                    }}
                  >
                    Price/kg
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {formatCurrency(batch.baseMeatPricePerKg)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <button
                  className="btn-icon"
                  onClick={() => deleteBatch(batch._id, batch.batchName)}
                  style={{ color: "var(--accent-red)" }}
                  title="Delete batch"
                >
                  <HiOutlineTrash size={16} />
                </button>
                <Link
                  href={`/batches/${batch._id}`}
                  className="btn btn-secondary btn-sm"
                >
                  Open Workspace <HiOutlineArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
