"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePrinter, HiOutlineSearch } from "react-icons/hi";
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

export default function BatchDetailPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [meatSales, setMeatSales] = useState<MeatSale[]>([]);
  const [byproducts, setByproducts] = useState<ByproductSale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profit, setProfit] = useState<ProfitCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState("");
  const [searchMeat, setSearchMeat] = useState("");
  const [searchByp, setSearchByp] = useState("");
  const [collectAmt, setCollectAmt] = useState("");
  const [collectTarget, setCollectTarget] = useState<{id:string,type:string,name:string,total:number,paid:number,due:number}|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{id:string,type:string,name:string}|null>(null);

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
    if (json.success) { toast.success("Batch updated!"); setModal(""); fetchData(); }
    else toast.error(json.error);
  };

  const addMeatSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { customerName: meatForm.customerName, kgQuantity: Number(meatForm.kgQuantity), pricePerKg: Number(meatForm.pricePerKg), paidAmount: Number(meatForm.paidAmount) || 0, date: meatForm.date };
    const res = await fetch(`/api/batches/${id}/meat-sales`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("Meat sale added"); setModal(""); setMeatForm({ customerName: "", kgQuantity: "", pricePerKg: String(batch?.baseMeatPricePerKg || ""), paidAmount: "", date: new Date().toISOString().split("T")[0] }); fetchData(); }
    else toast.error(json.error);
  };

  const addByproduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { itemType: bypForm.itemType, quantity: Number(bypForm.quantity), price: Number(bypForm.price), buyerName: bypForm.buyerName, paidAmount: Number(bypForm.paidAmount) || 0, date: bypForm.date };
    const res = await fetch(`/api/batches/${id}/byproducts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("Byproduct sale added"); setModal(""); setBypForm({ itemType: "chamra", quantity: "1", price: "", buyerName: "", paidAmount: "", date: new Date().toISOString().split("T")[0] }); fetchData(); }
    else toast.error(json.error);
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { expenseType: expForm.expenseType, amount: Number(expForm.amount), note: expForm.note, date: expForm.date };
    const res = await fetch(`/api/batches/${id}/expenses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json.success) { toast.success("Expense added"); setModal(""); setExpForm({ expenseType: "food", amount: "", note: "", date: new Date().toISOString().split("T")[0] }); fetchData(); }
    else toast.error(json.error);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: targetId, type } = deleteTarget;
    const url = type === "meat" ? `/api/batches/${id}/meat-sales/${targetId}` : type === "byproduct" ? `/api/batches/${id}/byproducts/${targetId}` : `/api/batches/${id}/expenses/${targetId}`;
    await fetch(url, { method: "DELETE" });
    toast.success("Deleted successfully"); setDeleteTarget(null); fetchData();
  };

  const collectPayment = async () => {
    if (!collectTarget || !collectAmt) return;
    const amt = Number(collectAmt);
    if (amt <= 0) { toast.error("Enter a valid amount"); return; }
    const newPaid = collectTarget.paid + amt;
    const newDue = collectTarget.total - newPaid;
    const url = collectTarget.type === "meat" ? `/api/batches/${id}/meat-sales/${collectTarget.id}` : `/api/batches/${id}/byproducts/${collectTarget.id}`;
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paidAmount: newPaid, dueAmount: newDue, totalPrice: collectTarget.total, total: collectTarget.total }) });
    const json = await res.json();
    if (json.success) { toast.success(`Collected ৳${amt} from ${collectTarget.name}`); setCollectTarget(null); setCollectAmt(""); fetchData(); }
    else toast.error(json.error);
  };

  // Filtered lists
  const filteredMeat = meatSales.filter(s => s.customerName.toLowerCase().includes(searchMeat.toLowerCase()));
  const filteredByp = byproducts.filter(b => (b.buyerName || "").toLowerCase().includes(searchByp.toLowerCase()));

  // All dues combined
  const allDues = [
    ...meatSales.filter(s => s.dueAmount > 0).map(s => ({ id: s._id, name: s.customerName, type: "Meat", total: s.totalPrice, paid: s.paidAmount, due: s.dueAmount })),
    ...byproducts.filter(b => b.dueAmount > 0).map(b => ({ id: b._id, name: b.buyerName || b.itemType, type: b.itemType, total: b.total, paid: b.paidAmount, due: b.dueAmount })),
  ];

  if (loading) return <LoadingSpinner />;
  if (!batch || !profit) return <div className="empty-state"><div className="empty-state-title">Batch not found</div></div>;

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "meat", label: `🥩 Meat Sales (${meatSales.length})` },
    { key: "byproducts", label: `🧾 Byproducts (${byproducts.length})` },
    { key: "expenses", label: `💸 Expenses (${expenses.length})` },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <Link href="/batches" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
        <HiOutlineArrowLeft size={16} /> Back to Batches
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.25rem" }}>{batch.batchName}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Purchased: {new Date(batch.purchaseDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><HiOutlinePrinter size={15} /> Print</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal("editBatch")}><HiOutlinePencil size={15} /> Edit</button>
          <span className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`} style={{ fontSize: "0.85rem", padding: "0.35rem 1rem" }}>{batch.status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav" style={{ marginBottom: "1.5rem" }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="animate-fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className={`stat-card ${profit.netProfit >= 0 ? "green" : "red"}`}>
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>Net Profit</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.netProfit)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>{profit.profitMargin.toFixed(1)}% margin</div>
            </div>
            <div className="stat-card blue">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>Total Revenue</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalRevenue)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>Meat + Byproducts</div>
            </div>
            <div className="stat-card purple">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>Total Cost</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalCost)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>All expenses</div>
            </div>
            <div className="stat-card yellow">
              <div style={{ fontSize: "0.78rem", opacity: 0.85, marginBottom: "0.4rem" }}>Total Due</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{fmt(profit.totalDue)}</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.2rem" }}>{fmt(profit.totalPaid)} collected</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {/* Revenue Breakdown */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-green)" }}>💵 Revenue Breakdown</h3>
              {[{ l: "Meat Sales", v: profit.totalMeatRevenue }, { l: "Byproduct Sales", v: profit.totalByproductRevenue }].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{r.l}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 700, color: "var(--accent-green)" }}>
                <span>Total Revenue</span><span>{fmt(profit.totalRevenue)}</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-red)" }}>📉 Cost Breakdown</h3>
              {[
                { l: "Buying Cost", v: profit.buyingCost }, { l: "Food Cost", v: profit.foodCost },
                { l: "Butcher Cost", v: profit.butcherCost }, { l: "Transport Cost", v: profit.transportCost },
                { l: "Other Expenses", v: profit.otherExpenses }, { l: "Additional Expenses", v: profit.additionalExpenses },
              ].map(r => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "0.65rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{r.l}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", fontWeight: 700, color: "var(--accent-red)" }}>
                <span>Total Cost</span><span>{fmt(profit.totalCost)}</span>
              </div>
            </div>

            {/* Stock Info */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-blue)" }}>📦 Stock & Metrics</h3>
              {[
                { l: "Total Meat", v: `${batch.totalMeatKg} kg` },
                { l: "Sold", v: `${profit.totalKgSold.toFixed(1)} kg` },
                { l: "Remaining", v: `${profit.remainingKg.toFixed(1)} kg` },
                { l: "Profit per kg", v: fmt(Math.round(profit.profitPerKg)) },
                { l: "Base Price/kg", v: fmt(batch.baseMeatPricePerKg) },
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
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--accent-yellow)" }}>💳 Pending Dues ({allDues.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allDues.map(d => (
                  <div key={d.id} className="due-item">
                    <div>
                      <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>{d.name}</span>
                      <span className="badge badge-blue" style={{ fontSize: "0.65rem" }}>{d.type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>{fmt(d.due)}</span>
                      <button className="btn-collect" onClick={() => { setCollectTarget({ id: d.id, type: d.type === "Meat" ? "meat" : "byproduct", name: d.name, total: d.total, paid: d.paid, due: d.due }); setCollectAmt(""); }}>Collect</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MEAT SALES TAB */}
      {tab === "meat" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontWeight: 700 }}>Meat Sales</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {meatSales.length > 0 && <div style={{ position: "relative" }}><HiOutlineSearch size={16} style={{ position: "absolute", left: 10, top: 9, color: "var(--text-muted)" }} /><input className="form-input" value={searchMeat} onChange={e => setSearchMeat(e.target.value)} placeholder="Search customer..." style={{ paddingLeft: "2rem", width: 180, height: 36, fontSize: "0.8rem" }} /></div>}
              <button className="btn btn-primary btn-sm" onClick={() => setModal("meat")}>+ Add Sale</button>
            </div>
          </div>
          <div className="glass-card" style={{ overflow: "auto" }}>
            {meatSales.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🥩</div><div className="empty-state-title">No meat sales yet</div><div className="empty-state-text">Add your first meat sale to this batch</div></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Customer</th><th>Kg</th><th>Price/kg</th><th>Total</th><th>Paid</th><th>Due</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredMeat.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.customerName}</td>
                      <td>{s.kgQuantity} kg</td>
                      <td>{fmt(s.pricePerKg)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(s.totalPrice)}</td>
                      <td style={{ color: "var(--accent-green)" }}>{fmt(s.paidAmount)}</td>
                      <td style={{ color: s.dueAmount > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{fmt(s.dueAmount)}</td>
                      <td>{new Date(s.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      <td><div className="action-group">
                        {s.dueAmount > 0 && <button className="btn-collect" onClick={() => { setCollectTarget({ id: s._id, type: "meat", name: s.customerName, total: s.totalPrice, paid: s.paidAmount, due: s.dueAmount }); setCollectAmt(""); }}>Collect</button>}
                        <button className="btn-icon" onClick={() => setDeleteTarget({ id: s._id, type: "meat", name: s.customerName })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>Total ({filteredMeat.length})</td>
                  <td>{filteredMeat.reduce((s, m) => s + m.kgQuantity, 0).toFixed(1)} kg</td>
                  <td></td>
                  <td>{fmt(filteredMeat.reduce((s, m) => s + m.totalPrice, 0))}</td>
                  <td style={{ color: "var(--accent-green)" }}>{fmt(filteredMeat.reduce((s, m) => s + m.paidAmount, 0))}</td>
                  <td style={{ color: "var(--accent-red)" }}>{fmt(filteredMeat.reduce((s, m) => s + m.dueAmount, 0))}</td>
                  <td></td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BYPRODUCTS TAB */}
      {tab === "byproducts" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontWeight: 700 }}>Byproduct Sales</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {byproducts.length > 0 && <div style={{ position: "relative" }}><HiOutlineSearch size={16} style={{ position: "absolute", left: 10, top: 9, color: "var(--text-muted)" }} /><input className="form-input" value={searchByp} onChange={e => setSearchByp(e.target.value)} placeholder="Search buyer..." style={{ paddingLeft: "2rem", width: 180, height: 36, fontSize: "0.8rem" }} /></div>}
              <button className="btn btn-primary btn-sm" onClick={() => setModal("byproduct")}>+ Add Byproduct</button>
            </div>
          </div>
          <div className="glass-card" style={{ overflow: "auto" }}>
            {byproducts.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🧾</div><div className="empty-state-title">No byproduct sales yet</div></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Type</th><th>Buyer</th><th>Qty</th><th>Price</th><th>Total</th><th>Paid</th><th>Due</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredByp.map(b => (
                    <tr key={b._id}>
                      <td><span className={`badge ${b.itemType === "chamra" ? "badge-purple" : b.itemType === "vuri" ? "badge-blue" : b.itemType === "pa" ? "badge-yellow" : "badge-green"}`}>{b.itemType}</span></td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.buyerName || "—"}</td>
                      <td>{b.quantity}</td>
                      <td>{fmt(b.price)}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(b.total)}</td>
                      <td style={{ color: "var(--accent-green)" }}>{fmt(b.paidAmount)}</td>
                      <td style={{ color: b.dueAmount > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{fmt(b.dueAmount)}</td>
                      <td>{new Date(b.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      <td><div className="action-group">
                        {b.dueAmount > 0 && <button className="btn-collect" onClick={() => { setCollectTarget({ id: b._id, type: "byproduct", name: b.buyerName || b.itemType, total: b.total, paid: b.paidAmount, due: b.dueAmount }); setCollectAmt(""); }}>Collect</button>}
                        <button className="btn-icon" onClick={() => setDeleteTarget({ id: b._id, type: "byproduct", name: b.buyerName || b.itemType })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>Total ({filteredByp.length})</td>
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

      {/* EXPENSES TAB */}
      {tab === "expenses" && (
        <div className="animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700 }}>Expenses</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setModal("expense")}>+ Add Expense</button>
          </div>
          <div className="glass-card" style={{ overflow: "auto" }}>
            {expenses.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">💸</div><div className="empty-state-title">No additional expenses</div></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Type</th><th>Amount</th><th>Note</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {expenses.map(ex => (
                    <tr key={ex._id}>
                      <td><span className="badge badge-red">{ex.expenseType}</span></td>
                      <td style={{ fontWeight: 600 }}>{fmt(ex.amount)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{ex.note || "—"}</td>
                      <td>{new Date(ex.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                      <td><button className="btn-icon" onClick={() => setDeleteTarget({ id: ex._id, type: "expense", name: ex.expenseType })} style={{ color: "var(--accent-red)", fontSize: "0.85rem" }}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td>Total ({expenses.length})</td>
                  <td style={{ color: "var(--accent-red)" }}>{fmt(expenses.reduce((s, e) => s + e.amount, 0))}</td>
                  <td></td><td></td><td></td>
                </tr></tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal isOpen={modal === "meat"} onClose={() => setModal("")} title="Add Meat Sale">
        <form onSubmit={addMeatSale}>
          <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" value={meatForm.customerName} onChange={e => setMeatForm({ ...meatForm, customerName: e.target.value })} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Quantity (kg) *</label><input type="number" step="0.01" className="form-input" value={meatForm.kgQuantity} onChange={e => setMeatForm({ ...meatForm, kgQuantity: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Price/kg (৳)</label><input type="number" className="form-input" value={meatForm.pricePerKg} onChange={e => setMeatForm({ ...meatForm, pricePerKg: e.target.value })} required /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Paid Amount (৳)</label><input type="number" className="form-input" value={meatForm.paidAmount} onChange={e => setMeatForm({ ...meatForm, paidAmount: e.target.value })} placeholder="0 if unpaid" /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={meatForm.date} onChange={e => setMeatForm({ ...meatForm, date: e.target.value })} /></div>
          </div>
          {meatForm.kgQuantity && meatForm.pricePerKg && <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem" }}>Total: <strong>{fmt(Number(meatForm.kgQuantity) * Number(meatForm.pricePerKg))}</strong> | Due: <strong style={{ color: "var(--accent-yellow)" }}>{fmt(Number(meatForm.kgQuantity) * Number(meatForm.pricePerKg) - (Number(meatForm.paidAmount) || 0))}</strong></div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Add Sale</button>
        </form>
      </Modal>

      <Modal isOpen={modal === "byproduct"} onClose={() => setModal("")} title="Add Byproduct Sale">
        <form onSubmit={addByproduct}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Item Type *</label><select className="form-select" value={bypForm.itemType} onChange={e => setBypForm({ ...bypForm, itemType: e.target.value })}><option value="chamra">Chamra (Hide)</option><option value="vuri">Vuri (Intestine)</option><option value="pa">Pa (Legs)</option><option value="other">Other</option></select></div>
            <div className="form-group"><label className="form-label">Buyer Name *</label><input className="form-input" value={bypForm.buyerName} onChange={e => setBypForm({ ...bypForm, buyerName: e.target.value })} placeholder="Customer name" required /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="form-input" value={bypForm.quantity} onChange={e => setBypForm({ ...bypForm, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Price (৳) *</label><input type="number" className="form-input" value={bypForm.price} onChange={e => setBypForm({ ...bypForm, price: e.target.value })} required /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Paid Amount (৳)</label><input type="number" className="form-input" value={bypForm.paidAmount} onChange={e => setBypForm({ ...bypForm, paidAmount: e.target.value })} placeholder="0 if unpaid" /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={bypForm.date} onChange={e => setBypForm({ ...bypForm, date: e.target.value })} /></div>
          </div>
          {bypForm.price && <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem" }}>Total: <strong>{fmt(Number(bypForm.quantity || 1) * Number(bypForm.price))}</strong> | Due: <strong style={{ color: "var(--accent-yellow)" }}>{fmt(Number(bypForm.quantity || 1) * Number(bypForm.price) - (Number(bypForm.paidAmount) || 0))}</strong></div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Add Byproduct Sale</button>
        </form>
      </Modal>

      <Modal isOpen={modal === "expense"} onClose={() => setModal("")} title="Add Expense">
        <form onSubmit={addExpense}>
          <div className="form-group"><label className="form-label">Expense Type *</label><select className="form-select" value={expForm.expenseType} onChange={e => setExpForm({ ...expForm, expenseType: e.target.value })}><option value="food">Food</option><option value="butcher">Butcher</option><option value="transport">Transport</option><option value="medicine">Medicine</option><option value="other">Other</option></select></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Amount (৳) *</label><input type="number" className="form-input" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Note</label><input className="form-input" value={expForm.note} onChange={e => setExpForm({ ...expForm, note: e.target.value })} placeholder="Optional note" /></div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Add Expense</button>
        </form>
      </Modal>

      <Modal isOpen={modal === "editBatch"} onClose={() => setModal("")} title="Edit Batch Info">
        <form onSubmit={updateBatch}>
          <div className="form-group"><label className="form-label">Batch Name *</label><input className="form-input" value={editForm.batchName} onChange={e => setEditForm({ ...editForm, batchName: e.target.value })} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Purchase Date</label><input type="date" className="form-input" value={editForm.purchaseDate} onChange={e => setEditForm({ ...editForm, purchaseDate: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Total Meat (kg)</label><input type="number" step="0.01" className="form-input" value={editForm.totalMeatKg} onChange={e => setEditForm({ ...editForm, totalMeatKg: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Buying Cost (৳)</label><input type="number" className="form-input" value={editForm.buyingCost} onChange={e => setEditForm({ ...editForm, buyingCost: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Food Cost (৳)</label><input type="number" className="form-input" value={editForm.foodCost} onChange={e => setEditForm({ ...editForm, foodCost: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Butcher Cost (৳)</label><input type="number" className="form-input" value={editForm.butcherCost} onChange={e => setEditForm({ ...editForm, butcherCost: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Transport Cost (৳)</label><input type="number" className="form-input" value={editForm.transportCost} onChange={e => setEditForm({ ...editForm, transportCost: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Other Expenses (৳)</label><input type="number" className="form-input" value={editForm.otherExpenses} onChange={e => setEditForm({ ...editForm, otherExpenses: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Base Price/kg (৳)</label><input type="number" className="form-input" value={editForm.baseMeatPricePerKg} onChange={e => setEditForm({ ...editForm, baseMeatPricePerKg: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="completed">Completed</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ resize: "vertical" }} /></div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Save Changes</button>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal isOpen={!!collectTarget} onClose={() => setCollectTarget(null)} title="Collect Payment">
        {collectTarget && (
          <div>
            <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "10px", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>Customer</span><span style={{ fontWeight: 700 }}>{collectTarget.name}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>Total</span><span style={{ fontWeight: 600 }}>{fmt(collectTarget.total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}><span style={{ color: "var(--text-muted)" }}>Already Paid</span><span style={{ color: "var(--accent-green)", fontWeight: 600 }}>{fmt(collectTarget.paid)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>Remaining Due</span><span style={{ color: "var(--accent-red)", fontWeight: 700, fontSize: "1.1rem" }}>{fmt(collectTarget.due)}</span></div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount Collecting Now (৳)</label>
              <input type="number" className="form-input" value={collectAmt} onChange={e => setCollectAmt(e.target.value)} placeholder={`Max ${collectTarget.due}`} max={collectTarget.due} autoFocus />
            </div>
            {collectAmt && Number(collectAmt) > 0 && (
              <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px", marginBottom: "1rem", fontSize: "0.85rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                After collection: Paid = <strong style={{ color: "var(--accent-green)" }}>{fmt(collectTarget.paid + Number(collectAmt))}</strong> | Due = <strong style={{ color: Number(collectAmt) >= collectTarget.due ? "var(--accent-green)" : "var(--accent-yellow)" }}>{fmt(collectTarget.due - Number(collectAmt))}</strong>
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={collectPayment} disabled={!collectAmt || Number(collectAmt) <= 0}>Collect Payment</button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Confirm Delete" confirmText="Delete" confirmColor="danger">
        <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.7 }}>This action cannot be undone.</p>
      </ConfirmModal>
    </div>
  );
}
