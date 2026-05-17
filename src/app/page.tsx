"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineScale,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
} from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BatchSummary {
  _id: string;
  batchName: string;
  status: string;
  purchaseDate: string;
  revenue: number;
  cost: number;
  profit: number;
  kgSold: number;
  totalMeatKg: number;
  createdAt: string;
}

interface DashboardData {
  totalBatches: number;
  activeBatches: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  totalKgSold: number;
  totalPaid: number;
  totalDue: number;
  batchSummaries: BatchSummary[];
}

function formatCurrency(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner />;

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">Failed to load dashboard</div>
        <div className="empty-state-text">Please check your connection and try again.</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Net Profit",
      value: formatCurrency(data.netProfit),
      icon: data.netProfit >= 0 ? HiOutlineTrendingUp : HiOutlineTrendingDown,
      color: data.netProfit >= 0 ? "green" : "red",
      sub: `${data.totalBatches} total batches`,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      color: "blue",
      sub: `${data.totalKgSold.toFixed(1)} kg sold`,
    },
    {
      label: "Total Cost",
      value: formatCurrency(data.totalCost),
      icon: HiOutlineCash,
      color: "purple",
      sub: `Across all batches`,
    },
    {
      label: "Total Due",
      value: formatCurrency(data.totalDue),
      icon: HiOutlineExclamationCircle,
      color: "yellow",
      sub: `${formatCurrency(data.totalPaid)} collected`,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.35rem" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Overview of your livestock business performance
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card ${card.color}`}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    opacity: 0.85,
                    marginBottom: "0.5rem",
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                  {card.value}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    opacity: 0.7,
                    marginTop: "0.35rem",
                  }}
                >
                  {card.sub}
                </div>
              </div>
              <card.icon size={28} style={{ opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Profit Chart */}
      {data.batchSummaries.length > 1 && (
        <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>📊 Profit by Batch</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.batchSummaries.slice(0, 8).map(b => ({ name: b.batchName.length > 12 ? b.batchName.slice(0, 12) + "…" : b.batchName, profit: b.profit }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1a2332", border: "1px solid #1e3a5f", borderRadius: "10px", color: "#f1f5f9" }} formatter={(value: unknown) => [formatCurrency(Number(value)), "Profit"]} />
              <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                {data.batchSummaries.slice(0, 8).map((b, i) => (
                  <Cell key={i} fill={b.profit >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Batches & Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Recent Batches */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
              Recent Batches
            </h2>
            <Link href="/batches" className="btn btn-secondary btn-sm">
              View All <HiOutlineArrowRight size={14} />
            </Link>
          </div>

          {data.batchSummaries.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-icon">🐄</div>
              <div className="empty-state-title">No batches yet</div>
              <div className="empty-state-text">
                Create your first cow batch to get started
              </div>
              <Link
                href="/batches/new"
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Create Batch
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {data.batchSummaries.slice(0, 5).map((batch) => (
                <Link
                  key={batch._id}
                  href={`/batches/${batch._id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 1rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    transition: "all 0.2s ease",
                  }}
                  className="glass-card"
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {batch.batchName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {new Date(batch.purchaseDate).toLocaleDateString()} •{" "}
                      {batch.kgSold.toFixed(1)} kg sold
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color:
                          batch.profit >= 0
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    >
                      {batch.profit >= 0 ? "+" : ""}
                      {formatCurrency(batch.profit)}
                    </div>
                    <span
                      className={`badge ${
                        batch.status === "active" ? "badge-green" : "badge-blue"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="glass-card" style={{ padding: "1.5rem" }}>
          <h2
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              marginBottom: "1.25rem",
            }}
          >
            Business Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                background: "var(--bg-secondary)",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <HiOutlineScale size={20} style={{ color: "var(--accent-blue)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Total Meat Sold
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {data.totalKgSold.toFixed(1)} kg
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                background: "var(--bg-secondary)",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <HiOutlineCash size={20} style={{ color: "var(--accent-green)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Total Collected
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {formatCurrency(data.totalPaid)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                background: "var(--bg-secondary)",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <HiOutlineExclamationCircle
                  size={20}
                  style={{ color: "var(--accent-yellow)" }}
                />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Total Due
                </span>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: data.totalDue > 0 ? "var(--accent-yellow)" : "inherit",
                }}
              >
                {formatCurrency(data.totalDue)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.85rem 1rem",
                background: "var(--bg-secondary)",
                borderRadius: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <HiOutlineTrendingUp
                  size={20}
                  style={{ color: "var(--accent-purple)" }}
                />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  Active Batches
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                {data.activeBatches}
              </span>
            </div>

            {data.totalKgSold > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.85rem 1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <HiOutlineCurrencyDollar
                    size={20}
                    style={{ color: "var(--accent-green-light)" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    Avg Profit/kg
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color:
                      data.netProfit / data.totalKgSold >= 0
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                  }}
                >
                  {formatCurrency(Math.round(data.netProfit / data.totalKgSold))}/kg
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
