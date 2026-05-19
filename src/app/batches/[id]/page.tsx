"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PullToRefresh from "@/components/PullToRefresh";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePrinter, HiOutlineSearch, HiPlus } from "react-icons/hi";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import type { ProfitCalculation } from "@/lib/profitCalculator";

interface Batch {
  _id: string;
  batchName: string;
  purchaseDate: string;
  buyingCost: number;
  foodCost: number;
  butcherCost: number;
  transportCost: number;
  otherExpenses: number;
  baseMeatPricePerKg: number;
  totalMeatKg: number;
  chamraPrice: number;
  vuriPrice: number;
  paPrice: number;
  status: string;
  notes: string;
}

interface MeatSale {
  _id: string;
  customerName: string;
  kgQuantity: number;
  pricePerKg: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
}

interface ByproductSale {
  _id: string;
  itemType: string;
  quantity: number;
  price: number;
  total: number;
  buyerName: string;
  paidAmount: number;
  dueAmount: number;
  date: string;
}

interface Expense {
  _id: string;
  expenseType: string;
  amount: number;
  note: string;
  date: string;
}

const fmt = (n: number) => "৳" + n.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const statusBn: Record<string, string> = { active: "চলমান", completed: "সম্পন্ন" };
const itemTypeBn: Record<string, string> = { chamra: "চামড়া", vuri: "ভুঁড়ি", pa: "পা", other: "অন্যান্য" };
const expTypeBn: Record<string, string> = { food: "খাবার", butcher: "কসাই", transport: "পরিবহন", medicine: "ওষুধ", other: "অন্যান্য" };

export default function BatchDetailPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [meatSales, setMeatSales] = useState<MeatSale[]>([]);
  const [byproducts, setByproducts] = useState<ByproductSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profit, setProfit] = useState<ProfitCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sales" | "overview">("sales");
  const [modal, setModal] = useState("");
  const [searchSales, setSearchSales] = useState("");
  const [collectAmt, setCollectAmt] = useState("");
  const [collectTarget, setCollectTarget] = useState<{id:string,type:string,name:string,total:number,paid:number,due:number}|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{id:string,type:string,name:string}|null>(null);
  const [customerNames, setCustomerNames] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<"meat"|"byp"|"">("")
  // sale type for unified modal: "meat" or byproduct types
  const [saleType, setSaleType] = useState("meat");
  const [fabOpen, setFabOpen] = useState(false);

  // Swipe gesture refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const tabKeys: ("sales" | "overview")[] = ["sales", "overview"];

  // Form states
  const [meatForm, setMeatForm] = useState({ customerName: "", kgQuantity: "", pricePerKg: "", paidAmount: "", date: new Date().toISOString().split("T")[0] });
  const [bypForm, setBypForm] = useState({ itemType: "chamra", quantity: "1", price: "", buyerName: "", paidAmount: "", date: new Date().toISOString().split("T")[0] });
  const [expForm, setExpForm] = useState({ expenseType: "food", amount: "", note: "", date: new Date().toISOString().split("T")[0] });
  const [editForm, setEditForm] = useState({ batchName: "", purchaseDate: "", buyingCost: "", foodCost: "", butcherCost: "", transportCost: "", otherExpenses: "", baseMeatPricePerKg: "", totalMeatKg: "", status: "active", notes: "" });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches/${id}`);
      const json = await res.json();
      if (json.success) {
        setBatch(json.data.batch);
        setMeatSales(json.data.meatSales);
        setByproducts(json.data.byproductSales);
        setExpenses(json.data.expenses);
        setProfit(json.data.profitData);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch customer names for autocomplete
  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(j => { if (j.success) setCustomerNames(j.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (batch) {
      setMeatForm(f => ({ ...f, pricePerKg: String(batch.baseMeatPricePerKg) }));
      setEditForm({
        batchName: batch.batchName,
        purchaseDate: new Date(batch.purchaseDate).toISOString().split("T")[0],
        buyingCost: String(batch.buyingCost),
        foodCost: String(batch.foodCost),
        butcherCost: String(batch.butcherCost),
        transportCost: String(batch.transportCost),
        otherExpenses: String(batch.otherExpenses),
        baseMeatPricePerKg: String(batch.baseMeatPricePerKg),
        totalMeatKg: String(batch.totalMeatKg),
        status: batch.status,
        notes: batch.notes,
      });
    }
  }, [batch]);

  const updateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      batchName: editForm.batchName,
      purchaseDate: editForm.purchaseDate,
      buyingCost: Number(editForm.buyingCost) || 0,
      foodCost: Number(editForm.foodCost) || 0,
      butcherCost: Number(editForm.butcherCost) || 0,
      transportCost: Number(editForm.transportCost) || 0,
      otherExpenses: Number(editForm.otherExpenses) || 0,
      baseMeatPricePerKg: Number(editForm.baseMeatPricePerKg) || 0,
      totalMeatKg: Number(editForm.totalMeatKg) || 0,
      status: editForm.status,
      notes: editForm.notes,
    };
    const res = await fetch(`/api/batches/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("ব্যাচ আপডেট হয়েছে!"); setModal(""); fetchData(); }
    else toast.error(json.error);
  };

  const addMeatSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { customerName: meatForm.customerName, kgQuantity: Number(meatForm.kgQuantity), pricePerKg: Number(meatForm.pricePerKg), paidAmount: Number(meatForm.paidAmount) || 0, date: meatForm.date };
    const res = await fetch(`/api/batches/${id}/meat-sales`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("গোশত বিক্রি যোগ হয়েছে"); setModal(""); setMeatForm({ customerName: "", kgQuantity: "", pricePerKg: String(batch?.baseMeatPricePerKg || ""), paidAmount: "", date: new Date().toISOString().split("T")[0] }); fetchData(); fetch("/api/customers").then(r => r.json()).then(j => { if (j.success) setCustomerNames(j.data); }); }
    else toast.error(json.error);
  };

  const addByproduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { itemType: saleType, quantity: Number(bypForm.quantity), price: Number(bypForm.price), buyerName: bypForm.buyerName, paidAmount: Number(bypForm.paidAmount) || 0, date: bypForm.date };
    const res = await fetch(`/api/batches/${id}/byproducts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("বিক্রি যোগ হয়েছে"); setModal(""); setBypForm({ itemType: "chamra", quantity: "1", price: "", buyerName: "", paidAmount: "", date: new Date().toISOString().split("T")[0] }); fetchData(); fetch("/api/customers").then(r => r.json()).then(j => { if (j.success) setCustomerNames(j.data); }); }
    else toast.error(json.error);
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { expenseType: expForm.expenseType, amount: Number(expForm.amount), note: expForm.note, date: expForm.date };
    const res = await fetch(`/api/batches/${id}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("খরচ যোগ হয়েছে"); setModal(""); setExpForm({ expenseType: "food", amount: "", note: "", date: new Date().toISOString().split("T")[0] }); fetchData(); }
    else toast.error(json.error);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: targetId, type } = deleteTarget;
    const url = type === "meat" ? `/api/batches/${id}/meat-sales/${targetId}` : type === "byproduct" ? `/api/batches/${id}/byproducts/${targetId}` : `/api/batches/${id}/expenses/${targetId}`;
    await fetch(url, { method: "DELETE" });
    toast.success("সফলভাবে ডিলিট হয়েছে"); setDeleteTarget(null); fetchData();
  };

  const collectPayment = async () => {
    if (!collectTarget || !collectAmt) return;
    const amt = Number(collectAmt);
    if (amt <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
    const newPaid = collectTarget.paid + amt;
    const newDue = collectTarget.total - newPaid;
    const url = collectTarget.type === "meat" ? `/api/batches/${id}/meat-sales/${collectTarget.id}` : `/api/batches/${id}/byproducts/${collectTarget.id}`;
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paidAmount: newPaid, dueAmount: newDue, totalPrice: collectTarget.total, total: collectTarget.total }) });
    const json = await res.json();
    if (json.success) { toast.success(`৳${amt} আদায় হয়েছে ${collectTarget.name} থেকে`); setCollectTarget(null); setCollectAmt(""); fetchData(); }
    else toast.error(json.error);
  };

  // Filtered lists (unified search)
  const filteredMeat = meatSales.filter(s => s.customerName.toLowerCase().includes(searchSales.toLowerCase()));
  const filteredByp = byproducts.filter(b => (b.buyerName || "").toLowerCase().includes(searchSales.toLowerCase()));

  // Helper: get filtered customer suggestions
  const getSuggestions = (query: string) => {
    if (!query || query.trim().length < 1) return [];
    
    // Robust Bengali search: ignore spaces, case, and zero-width joiners
    const sanitize = (str: string) => str.toLowerCase().replace(/[\s\u200C\u200D]+/g, '');
    const sanitizedQuery = sanitize(query);
    
    return customerNames
      .filter(n => sanitize(n).includes(sanitizedQuery))
      .slice(0, 5);
  };

  // All dues combined
  const allDues = [
    ...meatSales.filter(s => s.dueAmount > 0).map(s => ({ id: s._id, name: s.customerName, type: "Meat", total: s.totalPrice, paid: s.paidAmount, due: s.dueAmount })),
    ...byproducts.filter(b => b.dueAmount > 0).map(b => ({ id: b._id, name: b.buyerName || b.itemType, type: b.itemType, total: b.total, paid: b.paidAmount, due: b.dueAmount })),
  ];

  if (loading) return <LoadingSpinner />;
  if (!batch || !profit) return <div className="empty-state"><div className="empty-state-title">ব্যাচ পাওয়া যায়নি</div></div>;

  const tabs = [
    { key: "sales", label: `🛒 বিক্রি (${meatSales.length + byproducts.length})` },
    { key: "overview", label: "📊 সারসংক্ষেপ" },
  ];

  const handleDownloadPdf = async () => {
    const toastId = toast.loading("PDF তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন");
    
    try {
      // Add a class to body to apply print-like styles
      document.body.classList.add("pdf-exporting");
      
      // Wait a tick for styles to apply visually
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Get the main content area
      const element = document.querySelector(".main-content") || document.body;
      
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${batch?.batchName || "Batch"}_Report.pdf`);
      
      toast.success("PDF ডাউনলোড সফল হয়েছে!", { id: toastId });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("PDF তৈরি করতে সমস্যা হয়েছে", { id: toastId });
    } finally {
      document.body.classList.remove("pdf-exporting");
    }
  };

  return (
    <PullToRefresh onRefresh={fetchData}>
    <div className="animate-fade-in">
      {/* Print-only Header */}
      <div className="print-header">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>সাকিব-রাকিব এন্টারপ্রাইজ</h1>
        <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.15rem" }}>{batch.batchName}</p>
        <p style={{ fontSize: "0.85rem" }}>জবাইয়ের তারিখ: {new Date(batch.purchaseDate).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Mobile Sticky Header */}
      <div className="sticky-batch-header">
        <div className="batch-title">
          <Link href="/batches" style={{ color: "var(--text-muted)", display: "flex" }}><HiOutlineArrowLeft size={18} /></Link>
          {batch.batchName}
          <span className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>{statusBn[batch.status] || batch.status}</span>
        </div>
        <div className="tab-nav">
          {tabs.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key as any)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Desktop Header */}
      <Link href="/batches" className="no-print desktop-batch-header" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
        <HiOutlineArrowLeft size={16} /> ব্যাচ সমূহে ফিরুন
      </Link>
      <div className="no-print desktop-batch-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.25rem" }}>{batch.batchName}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>ক্রয়ের তারিখ: {new Date(batch.purchaseDate).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {tab === "sales" && <button className="btn btn-secondary btn-sm" onClick={handleDownloadPdf}><HiOutlinePrinter size={15} /> PDF ডাউনলোড</button>}
          <button className="btn btn-secondary btn-sm" onClick={() => setModal("editBatch")}><HiOutlinePencil size={15} /> ইডিট করুন</button>
          <span className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`} style={{ fontSize: "0.85rem", padding: "0.35rem 1rem" }}>{statusBn[batch.status] || batch.status}</span>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="tab-nav desktop-tab-nav" style={{ marginBottom: "1.5rem" }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key as any)}>{t.label}</button>
        ))}
      </div>

      {/* Swipeable content area */}
      <div
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={e => {
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            const idx = tabKeys.indexOf(tab);
            if (dx < 0 && idx < tabKeys.length - 1) setTab(tabKeys[idx + 1]);
            if (dx > 0 && idx > 0) setTab(tabKeys[idx - 1]);
          }
        }}
        style={{ touchAction: "pan-y" }}
      >
      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="animate-fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className={`stat-card ${profit.netProfit >= 0 ? "green" : "red"}`}>
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>নিট লাভ</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.netProfit)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>{profit.profitMargin.toFixed(1)}% মার্জিন</div>
            </div>
            <div className="stat-card blue">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>মোট আয়</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalRevenue)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>গোশত + চামড়া/ভুঁড়ি/পা</div>
            </div>
            <div className="stat-card purple">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>মোট খরচ</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalCost)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>সব খরচ মিলিয়ে</div>
            </div>
            <div className="stat-card yellow">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>মোট বাকি</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalDue)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>{fmt(profit.totalPaid)} আদায়</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {/* Revenue Breakdown */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-green)" }}>💵 আয়ের বিবরণ</h3>
              {[{ l: "গোশত বিক্রি", v: profit.totalMeatRevenue }, { l: "চামড়া/ভুঁড়ি/পা বিক্রি", v: profit.totalByproductRevenue }].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{r.l}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 700, color: "var(--accent-green)" }}>
                <span>মোট আয়</span><span>{fmt(profit.totalRevenue)}</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-red)" }}>📉 খরচের বিবরণ</h3>
              {[
                { l: "ক্রয়মূল্য", v: profit.buyingCost }, { l: "খাবার খরচ", v: profit.foodCost },
                { l: "কসাই খরচ", v: profit.butcherCost }, { l: "পরিবহন খরচ", v: profit.transportCost },
                { l: "অন্যান্য খরচ", v: profit.otherExpenses }, { l: "অতিরিক্ত খরচ", v: profit.additionalExpenses },
              ].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{r.l}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 700, color: "var(--accent-red)" }}>
                <span>মোট খরচ</span><span>{fmt(profit.totalCost)}</span>
              </div>
            </div>

            {/* Stock Info */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-blue)" }}>📦 স্টক ও মেট্রিক্স</h3>
              {[
                { l: "মোট গোশত", v: `${batch.totalMeatKg} কেজি` },
                { l: "বিক্রি হয়েছে", v: `${profit.totalKgSold.toFixed(1)} কেজি` },
                { l: "বাকি আছে", v: `${profit.remainingKg.toFixed(1)} কেজি` },
                { l: "লাভ/কেজি", v: fmt(Math.round(profit.profitPerKg)) },
                { l: "বেস দাম/কেজি", v: fmt(batch.baseMeatPricePerKg) },
              ].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{r.l}</span>
                  <span style={{ fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Due List */}
          {allDues.length > 0 && (
            <div className="glass-card" style={{ padding: "1.5rem", marginTop: "1.25rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-yellow)" }}>💳 বাকি তালিকা ({allDues.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allDues.map(d => (
                  <div key={d.id} className="due-item">
                    <div>
                      <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>{d.name}</span>
                      <span className="badge badge-blue" style={{ fontSize: "0.65rem" }}>{d.type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>{fmt(d.due)}</span>
                      <button className="btn-collect" onClick={() => { setCollectTarget({ id: d.id, type: d.type === "Meat" ? "meat" : "byproduct", name: d.name, total: d.total, paid: d.paid, due: d.due }); setCollectAmt(""); }}>আদায়</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* UNIFIED SALES TAB */}
      {tab === "sales" && (
        <div className="animate-fade-in">
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontWeight: 700 }}>সকল বিক্রি</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {(meatSales.length > 0 || byproducts.length > 0) && <div style={{ position: "relative" }}><HiOutlineSearch size={16} style={{ position: "absolute", left: 10, top: 9, color: "var(--text-muted)" }} /><input className="form-input" value={searchSales} onChange={e => setSearchSales(e.target.value)} placeholder="ক্রেতা খুঁজুন..." style={{ paddingLeft: "2rem", width: 180, height: 36, fontSize: "0.8rem" }} /></div>}
              <button className="btn btn-primary btn-sm" onClick={() => { setSaleType("meat"); setModal("sale"); }}>+ বিক্রি যোগ করুন</button>
            </div>
          </div>

          {/* Meat Sales Section */}
          <div className="glass-card" style={{ overflow: "auto", marginBottom: "1.25rem" }}>
            <div className="no-print" style={{ padding: "1rem 1.25rem 0.5rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--accent-green)", display: "flex", alignItems: "center", gap: "0.5rem" }}>🥩 গোশত বিক্রি ({filteredMeat.length})</div>
            {filteredMeat.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>কোনো গোশত বিক্রি নেই</div>
            ) : (
              <>
              {/* Desktop Table */}
              <table className="data-table desktop-table">
                <thead><tr><th>ক্রেতা</th><th>কেজি</th><th className="no-print">দাম/কেজি</th><th>মোট</th><th>পেইড</th><th>বাকি</th><th className="no-print">তারিখ</th><th className="no-print">অ্যাকশন</th></tr></thead>
                <tbody>
                  {filteredMeat.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.customerName}</td>
                      <td>{s.kgQuantity} কেজি</td>
                      <td className="no-print">{fmt(s.pricePerKg)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(s.totalPrice)}</td>
                      <td style={{ color: "var(--accent-green)" }}>{fmt(s.paidAmount)}</td>
                      <td style={{ color: s.dueAmount > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{fmt(s.dueAmount)}</td>
                      <td className="no-print">{new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      <td className="no-print"><div className="action-group">
                        {s.dueAmount > 0 && <button className="btn-collect" onClick={() => { setCollectTarget({ id: s._id, type: "meat", name: s.customerName, total: s.totalPrice, paid: s.paidAmount, due: s.dueAmount }); setCollectAmt(""); }}>আদায়</button>}
                        <button className="btn-icon" onClick={() => setDeleteTarget({ id: s._id, type: "meat", name: s.customerName })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>মোট ({filteredMeat.length})</td>
                  <td>{filteredMeat.reduce((s, m) => s + m.kgQuantity, 0).toFixed(1)} কেজি</td>
                  <td className="no-print"></td>
                  <td>{fmt(filteredMeat.reduce((s, m) => s + m.totalPrice, 0))}</td>
                  <td style={{ color: "var(--accent-green)" }}>{fmt(filteredMeat.reduce((s, m) => s + m.paidAmount, 0))}</td>
                  <td style={{ color: "var(--accent-red)" }}>{fmt(filteredMeat.reduce((s, m) => s + m.dueAmount, 0))}</td>
                  <td className="no-print"></td><td className="no-print"></td>
                </tr></tfoot>
              </table>
              {/* Mobile Cards */}
              <div className="mobile-sale-cards">
                {filteredMeat.map(s => (
                  <div key={s._id} className="sale-card">
                    <div className="sale-card-header">
                      <span className="sale-card-name">{s.customerName}</span>
                      <span className="sale-card-date">{new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <div className="sale-card-grid">
                      <div className="sale-card-stat"><div className="sale-card-stat-label">মোট</div><div className="sale-card-stat-value">{fmt(s.totalPrice)}</div></div>
                      <div className="sale-card-stat"><div className="sale-card-stat-label">পেইড</div><div className="sale-card-stat-value" style={{ color: "var(--accent-green)" }}>{fmt(s.paidAmount)}</div></div>
                      <div className="sale-card-stat"><div className="sale-card-stat-label">বাকি</div><div className="sale-card-stat-value" style={{ color: s.dueAmount > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{fmt(s.dueAmount)}</div></div>
                    </div>
                    <div className="sale-card-footer">
                      <span className="sale-card-kg">{s.kgQuantity} কেজি × {fmt(s.pricePerKg)}</span>
                      <div className="action-group">
                        {s.dueAmount > 0 && <button className="btn-collect" onClick={() => { setCollectTarget({ id: s._id, type: "meat", name: s.customerName, total: s.totalPrice, paid: s.paidAmount, due: s.dueAmount }); setCollectAmt(""); }}>আদায়</button>}
                        <button className="btn-icon" onClick={() => setDeleteTarget({ id: s._id, type: "meat", name: s.customerName })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: "0.5rem", background: "rgba(16,185,129,0.06)", borderRadius: "10px", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                  <span>মোট: {filteredMeat.reduce((s, m) => s + m.kgQuantity, 0).toFixed(1)} কেজি</span>
                  <span>{fmt(filteredMeat.reduce((s, m) => s + m.totalPrice, 0))}</span>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Byproducts Section */}
          <div className="glass-card no-print" style={{ overflow: "auto" }}>
            <div style={{ padding: "1rem 1.25rem 0.5rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "0.5rem" }}>🧾 চামড়া/ভুঁড়ি/পা ({filteredByp.length})</div>
            {filteredByp.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>কোনো চামড়া/ভুঁড়ি/পা বিক্রি নেই</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>ধরন</th><th>ক্রেতা</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th><th>পেইড</th><th>বাকি</th><th>তারিখ</th><th>অ্যাকশন</th></tr></thead>
                <tbody>
                  {filteredByp.map(b => (
                    <tr key={b._id}>
                      <td><span className={`badge ${b.itemType === "chamra" ? "badge-purple" : b.itemType === "vuri" ? "badge-blue" : b.itemType === "pa" ? "badge-yellow" : "badge-green"}`}>{itemTypeBn[b.itemType] || b.itemType}</span></td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.buyerName || "—"}</td>
                      <td>{b.quantity}</td>
                      <td>{fmt(b.price)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(b.total)}</td>
                      <td style={{ color: "var(--accent-green)" }}>{fmt(b.paidAmount)}</td>
                      <td style={{ color: b.dueAmount > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{fmt(b.dueAmount)}</td>
                      <td>{new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      <td><div className="action-group">
                        {b.dueAmount > 0 && <button className="btn-collect" onClick={() => { setCollectTarget({ id: b._id, type: "byproduct", name: b.buyerName || b.itemType, total: b.total, paid: b.paidAmount, due: b.dueAmount }); setCollectAmt(""); }}>আদায়</button>}
                        <button className="btn-icon" onClick={() => setDeleteTarget({ id: b._id, type: "byproduct", name: b.buyerName || b.itemType })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>মোট ({filteredByp.length})</td>
                  <td></td><td></td><td></td>
                  <td>{fmt(filteredByp.reduce((s, b) => s + b.total, 0))}</td>
                  <td style={{ color: "var(--accent-green)" }}>{fmt(filteredByp.reduce((s, b) => s + b.paidAmount, 0))}</td>
                  <td style={{ color: "var(--accent-red)" }}>{fmt(filteredByp.reduce((s, b) => s + b.dueAmount, 0))}</td>
                  <td></td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      </div>{/* end swipe area */}

      {/* FAB for mobile */}
      {tab === "sales" && (
        <div className="fab-container">
          <div className={`fab-menu ${fabOpen ? "open" : ""}`}>
            <button className="fab-menu-item" onClick={() => { setSaleType("meat"); setModal("sale"); setFabOpen(false); }}>🥩 গোশত বিক্রি</button>
            <button className="fab-menu-item" onClick={() => { setSaleType("chamra"); setModal("sale"); setFabOpen(false); }}>🧾 চামড়া/ভুঁড়ি/পা</button>
          </div>
          <button className={`fab-btn ${fabOpen ? "open" : ""}`} onClick={() => setFabOpen(!fabOpen)}>
            <HiPlus style={{ transition: "transform 0.3s ease", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }} />
          </button>
        </div>
      )}

      {/* UNIFIED SALE MODAL */}
      <Modal isOpen={modal === "sale"} onClose={() => { setModal(""); setShowSuggestions(""); }} title="বিক্রি যোগ করুন">
        {/* Sale Type Selector */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {[{ k: "meat", l: "🥩 গোশত" }, { k: "chamra", l: "চামড়া" }, { k: "vuri", l: "ভুঁড়ি" }, { k: "pa", l: "পা" }, { k: "other", l: "অন্যান্য" }].map(t => (
            <button key={t.k} type="button" className={`tab-btn ${saleType === t.k ? "active" : ""}`} style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }} onClick={() => setSaleType(t.k)}>{t.l}</button>
          ))}
        </div>

        {saleType === "meat" ? (
          <form onSubmit={addMeatSale}>
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">ক্রেতার নাম *</label>
              <input className="form-input" value={meatForm.customerName} onChange={e => { setMeatForm({ ...meatForm, customerName: e.target.value }); setShowSuggestions("meat"); }} onFocus={() => setShowSuggestions("meat")} onBlur={() => setTimeout(() => setShowSuggestions(""), 150)} required autoComplete="off" />
              {showSuggestions === "meat" && getSuggestions(meatForm.customerName).length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", zIndex: 10, maxHeight: 160, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                  {getSuggestions(meatForm.customerName).map(n => (
                    <div key={n} style={{ padding: "0.6rem 0.75rem", cursor: "pointer", fontSize: "0.88rem", borderBottom: "1px solid var(--border-color)" }} onMouseDown={() => { setMeatForm({ ...meatForm, customerName: n }); setShowSuggestions(""); }}>{n}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label className="form-label">পরিমাণ (কেজি) *</label><input type="number" step="0.01" className="form-input" value={meatForm.kgQuantity} onChange={e => setMeatForm({ ...meatForm, kgQuantity: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">দাম/কেজি (৳)</label><input type="number" className="form-input" value={meatForm.pricePerKg} onChange={e => setMeatForm({ ...meatForm, pricePerKg: e.target.value })} required /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label className="form-label">পেইড (৳)</label><input type="number" className="form-input" value={meatForm.paidAmount} onChange={e => setMeatForm({ ...meatForm, paidAmount: e.target.value })} placeholder="না দিলে ০" /></div>
              <div className="form-group"><label className="form-label">তারিখ</label><input type="date" className="form-input" value={meatForm.date} onChange={e => setMeatForm({ ...meatForm, date: e.target.value })} /></div>
            </div>
            {meatForm.kgQuantity && meatForm.pricePerKg && <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem" }}>মোট: <strong>{fmt(Number(meatForm.kgQuantity) * Number(meatForm.pricePerKg))}</strong> | বাকি: <strong style={{ color: "var(--accent-yellow)" }}>{fmt(Number(meatForm.kgQuantity) * Number(meatForm.pricePerKg) - (Number(meatForm.paidAmount) || 0))}</strong></div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>বিক্রি যোগ করুন</button>
          </form>
        ) : (
          <form onSubmit={(e) => { setBypForm(f => ({ ...f, itemType: saleType })); addByproduct(e); }}>
            <input type="hidden" value={saleType} />
            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">ক্রেতার নাম *</label>
              <input className="form-input" value={bypForm.buyerName} onChange={e => { setBypForm({ ...bypForm, buyerName: e.target.value }); setShowSuggestions("byp"); }} onFocus={() => setShowSuggestions("byp")} onBlur={() => setTimeout(() => setShowSuggestions(""), 150)} placeholder="ক্রেতার নাম" required autoComplete="off" />
              {showSuggestions === "byp" && getSuggestions(bypForm.buyerName).length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", zIndex: 10, maxHeight: 160, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                  {getSuggestions(bypForm.buyerName).map(n => (
                    <div key={n} style={{ padding: "0.6rem 0.75rem", cursor: "pointer", fontSize: "0.88rem", borderBottom: "1px solid var(--border-color)" }} onMouseDown={() => { setBypForm({ ...bypForm, buyerName: n }); setShowSuggestions(""); }}>{n}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label className="form-label">পরিমাণ</label><input type="number" className="form-input" value={bypForm.quantity} onChange={e => setBypForm({ ...bypForm, quantity: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">দাম (৳) *</label><input type="number" className="form-input" value={bypForm.price} onChange={e => setBypForm({ ...bypForm, price: e.target.value })} required /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div className="form-group"><label className="form-label">পেইড (৳)</label><input type="number" className="form-input" value={bypForm.paidAmount} onChange={e => setBypForm({ ...bypForm, paidAmount: e.target.value })} placeholder="না দিলে ০" /></div>
              <div className="form-group"><label className="form-label">তারিখ</label><input type="date" className="form-input" value={bypForm.date} onChange={e => setBypForm({ ...bypForm, date: e.target.value })} /></div>
            </div>
            {bypForm.price && <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem" }}>মোট: <strong>{fmt(Number(bypForm.quantity || 1) * Number(bypForm.price))}</strong> | বাকি: <strong style={{ color: "var(--accent-yellow)" }}>{fmt(Number(bypForm.quantity || 1) * Number(bypForm.price) - (Number(bypForm.paidAmount) || 0))}</strong></div>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>বিক্রি যোগ করুন</button>
          </form>
        )}
      </Modal>

      <Modal isOpen={modal === "expense"} onClose={() => setModal("")} title="খরচ যোগ করুন">
        <form onSubmit={addExpense}>
          <div className="form-group"><label className="form-label">খরচের ধরন *</label><select className="form-select" value={expForm.expenseType} onChange={e => setExpForm({ ...expForm, expenseType: e.target.value })}><option value="food">খাবার</option><option value="butcher">কসাই</option><option value="transport">পরিবহন</option><option value="medicine">ওষুধ</option><option value="other">অন্যান্য</option></select></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">পরিমাণ (৳) *</label><input type="number" className="form-input" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">তারিখ</label><input type="date" className="form-input" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">নোট</label><input className="form-input" value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} placeholder="ঐচ্ছিক নোট" /></div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>খরচ যোগ করুন</button>
        </form>
      </Modal>

      <Modal isOpen={modal === "editBatch"} onClose={() => setModal("")} title="ব্যাচের তথ্য ইডিট করুন">
        <form onSubmit={updateBatch}>
          <div className="form-group"><label className="form-label">ব্যাচের নাম *</label><input className="form-input" value={editForm.batchName} onChange={e => setEditForm({ ...editForm, batchName: e.target.value })} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">ক্রয়ের তারিখ</label><input type="date" className="form-input" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">মোট গোশত (কেজি)</label><input type="number" step="0.01" className="form-input" value={editForm.totalMeatKg} onChange={e => setEditForm({ ...editForm, totalMeatKg: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">ক্রয়মূল্য (৳)</label><input type="number" className="form-input" value={editForm.buyingCost} onChange={e => setEditForm({ ...editForm, buyingCost: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">খাবার খরচ (৳)</label><input type="number" className="form-input" value={editForm.foodCost} onChange={e => setEditForm({ ...editForm, foodCost: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">কসাই খরচ (৳)</label><input type="number" className="form-input" value={editForm.butcherCost} onChange={e => setEditForm({ ...editForm, butcherCost: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">পরিবহন খরচ (৳)</label><input type="number" className="form-input" value={editForm.transportCost} onChange={e => setEditForm({ ...editForm, transportCost: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">অন্যান্য খরচ (৳)</label><input type="number" className="form-input" value={editForm.otherExpenses} onChange={e => setEditForm({ ...editForm, otherExpenses: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">বেস দাম/কেজি (৳)</label><input type="number" className="form-input" value={editForm.baseMeatPricePerKg} onChange={e => setEditForm({ ...editForm, baseMeatPricePerKg: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">স্ট্যাটাস</label><select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">চলমান</option><option value="completed">সম্পন্ন</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">নোট</label><textarea className="form-input" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ resize: "vertical" }} /></div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>সেইভ করুন</button>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal isOpen={!!collectTarget} onClose={() => setCollectTarget(null)} title="টাকা আদায়">
        {collectTarget && (
          <div>
            <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>ক্রেতা</span><span style={{ fontWeight: 700 }}>{collectTarget.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>মোট</span><span style={{ fontWeight: 600 }}>{fmt(collectTarget.total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>আগে দিয়েছে</span><span style={{ color: "var(--accent-green)", fontWeight: 600 }}>{fmt(collectTarget.paid)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>বাকি আছে</span><span style={{ color: "var(--accent-red)", fontWeight: 700, fontSize: "1.1rem" }}>{fmt(collectTarget.due)}</span></div>
            </div>
            <div className="form-group">
              <label className="form-label">এখন কত আদায় করছেন (৳)</label>
              <input type="number" className="form-input" value={collectAmt} onChange={e => setCollectAmt(e.target.value)} placeholder={`সর্বোচ্চ ${collectTarget.due}`} max={collectTarget.due} autoFocus />
            </div>
            {collectAmt && Number(collectAmt) > 0 && (
              <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                আদায়ের পর: পেইড = <strong style={{ color: "var(--accent-green)" }}>{fmt(collectTarget.paid + Number(collectAmt))}</strong> | বাকি = <strong style={{ color: Number(collectAmt) >= collectTarget.due ? "var(--accent-green)" : "var(--accent-yellow)" }}>{fmt(collectTarget.due - Number(collectAmt))}</strong>
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={collectPayment} disabled={!collectAmt || Number(collectAmt) <= 0}>টাকা আদায় করুন</button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="ডিলিট নিশ্চিত করুন" confirmText="ডিলিট" confirmColor="danger">
        <p>আপনি কি নিশ্চিত <strong>{deleteTarget?.name}</strong> ডিলিট করতে চান?</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.7 }}>এই কাজটি ফেরত নেওয়া যাবে না।</p>
      </ConfirmModal>
    </div>
    </PullToRefresh>
  );
}
