"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  HiOutlinePlusCircle,
  HiOutlineSearch,
  HiOutlineTrash,
} from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import PullToRefresh from "@/components/PullToRefresh";
import toast from "react-hot-toast";

interface BatchItem {
  _id: string;
  batchName: string;
  purchaseDate: string;
  buyingCost: number;
  status: string;
  baseMeatPricePerKg: number;
  totalMeatKg: number;
  createdAt: string;
}

interface BatchListClientProps {
  initialBatches: BatchItem[];
}

function formatCurrency(amount: number): string {
  return (
    "৳" +
    amount.toLocaleString("en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

const statusBn: Record<string, string> = {
  active: "চলমান",
  completed: "সম্পন্ন",
};

export default function BatchListClient({
  initialBatches,
}: BatchListClientProps) {
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/batches", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        const normalized = json.data.map((batch: any) => ({
          ...batch,
          _id: batch._id.toString(),
          purchaseDate: batch.purchaseDate,
          createdAt: batch.createdAt,
        }));
        setBatches(normalized);
      }
    } catch (err) {
      console.error("Failed to load batches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBatch = useCallback(async (id: string, name: string) => {
    if (
      !confirm(
        `আপনি কি নিশ্চিত "${name}" ডিলিট করতে চান? এর সাথে সংযুক্ত সব বিক্রি ও খরচও মুছে যাবে।`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(`"${name}" ডিলিট করা হয়েছে`);
        setBatches((prev) => prev.filter((b) => b._id !== id));
      } else {
        toast.error(json.error || "ডিলিট করতে সমস্যা হয়েছে");
      }
    } catch (err) {
      console.error("Failed to delete batch:", err);
      toast.error("ডিলিট করতে সমস্যা হয়েছে");
    }
  }, []);

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      const matchesSearch = b.batchName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || b.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [batches, search, filterStatus]);

  if (loading) return <LoadingSpinner />;

  return (
    <PullToRefresh onRefresh={fetchBatches}>
      <div className="animate-fade-in">
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
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                marginBottom: "0.35rem",
              }}
            >
              ব্যাচ সমূহ
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              আপনার সব গরু ক্রয় ও জবাইয়ের ব্যাচ
            </p>
          </div>
          <Link href="/batches/new" className="btn btn-primary">
            <HiOutlinePlusCircle size={18} />
            নতুন ব্যাচ
          </Link>
        </div>

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
              placeholder="ব্যাচ খুঁজুন..."
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
            <option value="all">সব স্ট্যাটাস</option>
            <option value="active">চলমান</option>
            <option value="completed">সম্পন্ন</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-state-icon">🐄</div>
              <div className="empty-state-title">
                {batches.length === 0
                  ? "এখনও কোনো ব্যাচ নেই"
                  : "কোনো ফলাফল পাওয়া যায়নি"}
              </div>
              <div className="empty-state-text">
                {batches.length === 0
                  ? "লাভ-ক্ষতি হিসাব শুরু করতে প্রথম ব্যাচ তৈরি করুন"
                  : "সার্চ বা ফিল্টার পরিবর্তন করে দেখুন"}
              </div>
              {batches.length === 0 && (
                <Link
                  href="/batches/new"
                  className="btn btn-primary"
                  style={{ marginTop: "1rem" }}
                >
                  প্রথম ব্যাচ তৈরি করুন
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
                      {new Date(batch.purchaseDate).toLocaleDateString(
                        "bn-BD",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </div>
                  </div>
                  <span
                    className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`}
                  >
                    {statusBn[batch.status] || batch.status}
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
                      ক্রয়মূল্য
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
                      মোট গোশত
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                      {batch.totalMeatKg.toFixed(1)} কেজি
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <Link
                    href={`/batches/${batch._id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: 130 }}
                  >
                    বিস্তারিত দেখুন
                  </Link>
                  <button
                    className="btn btn-danger btn-sm"
                    type="button"
                    onClick={() => deleteBatch(batch._id, batch.batchName)}
                  >
                    <HiOutlineTrash size={18} />
                    ডিলিট
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
