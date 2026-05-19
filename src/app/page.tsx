"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineScale,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineSearch,
} from "react-icons/hi";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import PullToRefresh from "@/components/PullToRefresh";

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
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<string[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, custRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/customers")
      ]);
      const dashJson = await dashRes.json();
      const custJson = await custRes.json();
      
      if (dashJson.success) setData(dashJson.data);
      if (custJson.success) setCustomers(custJson.data);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers([]);
    } else {
      const sanitize = (str: string) => str.toLowerCase().replace(/[\s\u200C\u200D]+/g, '');
      setFilteredCustomers(customers.filter(c => sanitize(c).includes(sanitize(searchQuery))));
    }
  }, [searchQuery, customers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Quick action data
  const latestActive = data.batchSummaries.find(b => b.status === "active");

  return (
    <PullToRefresh onRefresh={fetchDashboard}>
    <div className="animate-fade-in">
      {/* Header with Search */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.35rem" }}>
            ড্যাশবোর্ড
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            আপনার গরুর গোশত ব্যবসার সার্বিক চিত্র
          </p>
        </div>

        <div ref={searchRef} style={{ position: "relative", width: "100%", maxWidth: "350px", zIndex: 10 }}>
          <div style={{ position: "relative" }}>
            <HiOutlineSearch 
              style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} 
              size={18} 
            />
            <input
              type="text"
              className="form-input"
              placeholder="কাস্টমারের নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{ paddingLeft: "2.5rem", marginBottom: 0 }}
            />
          </div>
          
          {showDropdown && searchQuery && (
            <div className="glass-card" style={{ 
              position: "absolute", 
              top: "100%", 
              left: 0, 
              right: 0, 
              marginTop: "0.5rem", 
              maxHeight: "250px", 
              overflowY: "auto",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
            }}>
              {filteredCustomers.length > 0 ? (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {filteredCustomers.map((customer, i) => (
                    <li key={i}>
                      <button
                        onClick={() => router.push(`/customers/${encodeURIComponent(customer)}`)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.85rem 1rem",
                          background: "transparent",
                          border: "none",
                          borderBottom: i < filteredCustomers.length - 1 ? "1px solid var(--border-color)" : "none",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {customer}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ padding: "1rem", color: "var(--text-muted)", textAlign: "center", fontSize: "0.9rem" }}>
                  কোনো কাস্টমার পাওয়া যায়নি
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions - Mobile Only */}
      <div className="quick-actions">
        {latestActive && (
          <Link href={`/batches/${latestActive._id}`} className="quick-action-card">
            <div className="quick-action-icon" style={{ background: "rgba(16,185,129,0.15)" }}>🐄</div>
            <div>
              <div className="quick-action-label">{latestActive.batchName}</div>
              <div className="quick-action-sub">সর্বশেষ ব্যাচ</div>
            </div>
          </Link>
        )}
        <Link href="/batches/new" className="quick-action-card">
          <div className="quick-action-icon" style={{ background: "rgba(59,130,246,0.15)" }}>➕</div>
          <div>
            <div className="quick-action-label">নতুন ব্যাচ</div>
            <div className="quick-action-sub">তৈরি করুন</div>
          </div>
        </Link>
        {data.totalDue > 0 && (
          <Link href="/" className="quick-action-card" style={{ gridColumn: "1 / -1" }}>
            <div className="quick-action-icon" style={{ background: "rgba(245,158,11,0.15)" }}>💳</div>
            <div>
              <div className="quick-action-label">মোট বাকি: {formatCurrency(data.totalDue)}</div>
              <div className="quick-action-sub">{formatCurrency(data.totalPaid)} আদায় হয়েছে</div>
            </div>
          </Link>
        )}
      </div>

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
    </PullToRefresh>
  );
}
