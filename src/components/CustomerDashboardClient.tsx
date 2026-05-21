"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  HiOutlineArrowLeft,
  HiOutlineCash,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineScale,
} from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toBengaliDigits, formatCurrency, formatBengaliDate } from "@/lib/bnUtils";

interface PurchaseHistory {
  _id: string;
  batchId: string;
  batchName: string;
  type: string;
  detail: string;
  total: number;
  paid: number;
  due: number;
  date: string;
}

interface CustomerData {
  name: string;
  totalPurchased: number;
  totalPaid: number;
  totalDue: number;
  history: PurchaseHistory[];
}

interface CustomerDashboardClientProps {
  customerName: string;
  data: CustomerData;
}


export default function CustomerDashboardClient({ customerName, data }: CustomerDashboardClientProps) {
  const router = useRouter();
  const [customerData, setCustomerData] = useState<CustomerData>(data);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(customerName)}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setCustomerData(json.data);
      } else {
        toast.error("কাস্টমারের তথ্য পাওয়া যায়নি");
        router.push("/");
      }
    } catch (err) {
      console.error("Failed to refresh customer data:", err);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [customerName, router]);

  const handlePayment = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = Number(paymentAmount);

    if (!amount || amount <= 0) {
      toast.error("সঠিক টাকার পরিমাণ দিন");
      return;
    }

    if (customerData && amount > customerData.totalDue) {
      toast.error("পেমেন্ট বকেয়া থেকে বেশি হতে পারে না");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(customerName)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`৳${toBengaliDigits(amount)} পেমেন্ট সফল হয়েছে`);
        setPaymentAmount("");
        await refreshCustomer();
      } else {
        toast.error(json.error || "পেমেন্ট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("সার্ভার এরর");
    } finally {
      setIsProcessing(false);
    }
  }, [customerName, customerData, paymentAmount, refreshCustomer]);

  if (loading) return <LoadingSpinner />;

  if (!customerData) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">কাস্টমারের তথ্য পাওয়া যায়নি</div>
      </div>
    );
  }

  const typeBn: Record<string, string> = {
    meat: "গোশত",
    chamra: "চামড়া",
    vuri: "ভুঁড়ি",
    pa: "পা",
    other: "অন্যান্য",
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/" className="btn btn-secondary btn-sm" style={{ padding: "0.5rem" }}>
          <HiOutlineArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.2rem" }}>
            {customerData.name}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            কাস্টমার প্রোফাইল এবং লেনদেনের বিবরণ
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="stat-card blue">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 500, opacity: 0.85, marginBottom: "0.5rem" }}>
                মোট ক্রয়
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                {formatCurrency(customerData.totalPurchased)}
              </div>
            </div>
            <HiOutlineScale size={28} style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div className="stat-card green">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 500, opacity: 0.85, marginBottom: "0.5rem" }}>
                মোট পরিশোধ
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                {formatCurrency(customerData.totalPaid)}
              </div>
            </div>
            <HiOutlineCash size={28} style={{ opacity: 0.7 }} />
          </div>
        </div>

        <div className={`stat-card ${customerData.totalDue > 0 ? "red" : "purple"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 500, opacity: 0.85, marginBottom: "0.5rem" }}>
                মোট বকেয়া
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
                {formatCurrency(customerData.totalDue)}
              </div>
            </div>
            <HiOutlineExclamationCircle size={28} style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.5rem", alignItems: "start" }}>
        {customerData.totalDue > 0 && (
          <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HiOutlineCurrencyDollar className="text-accent-green" />
              পেমেন্ট গ্রহণ করুন
            </h2>
            <form onSubmit={handlePayment} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">টাকার পরিমাণ</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="যেমন: ৫০০"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  max={customerData.totalDue}
                  step="any"
                  disabled={isProcessing}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isProcessing || !paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > customerData.totalDue} style={{ padding: "0.6rem 1.5rem" }}>
                {isProcessing ? "প্রসেস হচ্ছে..." : "জমা দিন"}
              </button>
            </form>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
              * পেমেন্ট স্বয়ংক্রিয়ভাবে সবচেয়ে পুরনো বকেয়া থেকে কাটা হবে (FIFO পদ্ধতি)।
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" }}>
            লেনদেনের বিবরণ
          </h2>

          {customerData.history.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-text">কোনো লেনদেন পাওয়া যায়নি</div>
            </div>
          ) : (
            <table className="data-table desktop-table" style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "1rem" }}>তারিখ</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>ব্যাচ</th>
                  <th style={{ textAlign: "left", padding: "1rem" }}>বিবরণ</th>
                  <th style={{ textAlign: "right", padding: "1rem" }}>মোট</th>
                  <th style={{ textAlign: "right", padding: "1rem" }}>পরিশোধ</th>
                  <th style={{ textAlign: "right", padding: "1rem" }}>বকেয়া</th>
                </tr>
              </thead>
              <tbody>
                {customerData.history.map((item) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                      {formatBengaliDate(item.date, { day: "numeric", month: "short", includeYear: true })}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{item.batchName}</td>
                    <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{item.detail}</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontSize: "0.9rem" }}>{formatCurrency(item.total)}</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontSize: "0.9rem" }}>{formatCurrency(item.paid)}</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontSize: "0.9rem" }}>{formatCurrency(item.due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
