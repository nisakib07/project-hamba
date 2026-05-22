"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCurrencyDollar,
  HiOutlineCash,
  HiOutlineExclamationCircle,
  HiOutlineSearch,
} from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import PullToRefresh from "@/components/PullToRefresh";
import { toBengaliDigits, formatCurrency, formatBengaliDate } from "@/lib/bnUtils";

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

interface DashboardClientProps {
  data: DashboardData;
  customers: string[];
}

export default function DashboardClient({ data, customers }: DashboardClientProps) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData>(data);
  const [customerList, setCustomerList] = useState<string[]>(customers);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return customerList.slice(0, 8);
    const sanitize = (str: string) => str.toLowerCase().replace(/[\s\u200C\u200D]+/g, "");
    const normalized = sanitize(query);
    return customerList.filter((customer) => sanitize(customer).includes(normalized));
  }, [searchQuery, customerList]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, custRes] = await Promise.all([
        fetch("/api/dashboard", { cache: "no-store" }),
        fetch("/api/customers", { cache: "no-store" }),
      ]);

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson.success) setDashboardData(dashJson.data);
      }

      if (custRes.ok) {
        const custJson = await custRes.json();
        if (custJson.success) setCustomerList(custJson.data);
      }
    } catch (err) {
      console.error("Failed to refresh dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCustomerClick = (customer: string) => {
    setShowDropdown(false);
    setSearchQuery(customer);
    router.push(`/customers/${encodeURIComponent(customer)}`);
  };

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      label: "নিট লাভ",
      value: formatCurrency(dashboardData.netProfit),
      icon: dashboardData.netProfit >= 0 ? HiOutlineTrendingUp : HiOutlineTrendingDown,
      color: dashboardData.netProfit >= 0 ? "green" : "red",
      sub: `${toBengaliDigits(dashboardData.totalBatches)}টি ব্যাচ মোট`,
    },
    {
      label: "মোট আয়",
      value: formatCurrency(dashboardData.totalRevenue),
      icon: HiOutlineCurrencyDollar,
      color: "blue",
      sub: `${toBengaliDigits(dashboardData.totalKgSold.toFixed(1))} কেজি বিক্রি`,
    },
    {
      label: "মোট খরচ",
      value: formatCurrency(dashboardData.totalCost),
      icon: HiOutlineCash,
      color: "purple",
      sub: "সব ব্যাচ মিলিয়ে",
    },
    {
      label: "মোট বাকি",
      value: formatCurrency(dashboardData.totalDue),
      icon: HiOutlineExclamationCircle,
      color: "yellow",
      sub: `${formatCurrency(dashboardData.totalPaid)} আদায় হয়েছে`,
    },
  ];

  return (
    <PullToRefresh onRefresh={fetchDashboard}>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.35rem" }}>ড্যাশবোর্ড</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>আপনার গরুর গোশত ব্যবসার সার্বিক চিত্র</p>
          </div>

          {/* Customer Search */}
          <div ref={searchRef} style={{ position: "relative", width: "100%", maxWidth: "350px", zIndex: 20 }}>
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
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                style={{ paddingLeft: "2.5rem", marginBottom: 0 }}
              />
            </div>

            {showDropdown && filteredCustomers.length > 0 && (
              <div className="glass-card" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, maxHeight: "260px", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", padding: 0 }}>
                <div style={{ padding: "0.5rem 1rem", fontSize: "0.72rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", fontWeight: 600 }}>
                  {searchQuery ? "ফলাফল" : "সকল কাস্টমার"}
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {filteredCustomers.map((customer, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => handleCustomerClick(customer)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.85rem 1rem",
                          background: "transparent",
                          border: "none",
                          borderBottom: i < filteredCustomers.length - 1 ? "1px solid var(--border-color)" : "none",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ opacity: 0.5 }}>👤</span>
                        {customer}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="quick-actions">
          {dashboardData.batchSummaries.find((b) => b.status === "active") && (
            <Link href={`/batches/${dashboardData.batchSummaries.find((b) => b.status === "active")!._id}`} className="quick-action-card">
              <div className="quick-action-icon" style={{ background: "rgba(16,185,129,0.15)" }}>🐄</div>
              <div>
                <div className="quick-action-label">{dashboardData.batchSummaries.find((b) => b.status === "active")!.batchName}</div>
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
          {dashboardData.totalDue > 0 && (
            <Link href="/" className="quick-action-card" style={{ gridColumn: "1 / -1" }}>
              <div className="quick-action-icon" style={{ background: "rgba(245,158,11,0.15)" }}>💳</div>
              <div>
                <div className="quick-action-label">মোট বাকি: {formatCurrency(dashboardData.totalDue)}</div>
                <div className="quick-action-sub">{formatCurrency(dashboardData.totalPaid)} আদায় হয়েছে</div>
              </div>
            </Link>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`stat-card ${item.color}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, opacity: 0.85, marginBottom: "0.5rem" }}>{item.label}</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1.1 }}>{item.value}</div>
                    <div style={{ marginTop: "0.4rem", fontSize: "0.78rem", opacity: 0.75 }}>{item.sub}</div>
                  </div>
                  <Icon size={28} style={{ opacity: 0.8 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Batch Summaries Table */}
        {dashboardData.batchSummaries.length > 0 && (
          <div className="glass-card" style={{ overflow: "auto" }}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--accent-green)" }}>
              📋 ব্যাচ সমূহ ({toBengaliDigits(dashboardData.batchSummaries.length)})
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ব্যাচ</th>
                  <th>স্ট্যাটাস</th>
                  <th>আয়</th>
                  <th>লাভ/ক্ষতি</th>
                  <th>তারিখ</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.batchSummaries.map((b) => (
                  <tr key={b._id} style={{ cursor: "pointer" }}>
                    <td style={{ fontWeight: 600, padding: 0 }}>
                      <Link href={`/batches/${b._id}`} style={{ display: "block", padding: "0.85rem 1rem", color: "var(--text-primary)", textDecoration: "none" }}>
                        {b.batchName}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/batches/${b._id}`} style={{ display: "block", padding: "0.85rem 0", textDecoration: "none", color: "inherit" }}>
                        <span className={`badge ${b.status === "active" ? "badge-green" : "badge-blue"}`} style={{ fontSize: "0.7rem" }}>
                          {b.status === "active" ? "চলমান" : "সম্পন্ন"}
                        </span>
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/batches/${b._id}`} style={{ display: "block", padding: "0.85rem 0", textDecoration: "none", color: "inherit" }}>
                        {formatCurrency(b.revenue)}
                      </Link>
                    </td>
                    <td style={{ color: b.profit >= 0 ? "var(--accent-green)" : "var(--accent-red)", fontWeight: 700 }}>
                      <Link href={`/batches/${b._id}`} style={{ display: "block", padding: "0.85rem 0", textDecoration: "none", color: "inherit" }}>
                        {b.profit >= 0 ? "+" : ""}{formatCurrency(b.profit)}
                      </Link>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      <Link href={`/batches/${b._id}`} style={{ display: "block", padding: "0.85rem 0", textDecoration: "none", color: "inherit" }}>
                        {formatBengaliDate(b.purchaseDate, { day: "2-digit", month: "short" })}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
