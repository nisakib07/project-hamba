"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import PullToRefresh from "@/components/PullToRefresh";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlinePrinter,
  HiOutlineSearch,
  HiPlus,
} from "react-icons/hi";
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
import {
  toBengaliDigits,
  formatCurrency as fmt,
  formatBengaliDate,
} from "@/lib/bnUtils";

const statusBn: Record<string, string> = {
  active: "চলমান",
  completed: "সম্পন্ন",
};
const itemTypeBn: Record<string, string> = {
  chamra: "চামড়া",
  vuri: "ভুঁড়ি",
  pa: "পা",
  other: "অন্যান্য",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const expTypeBn: Record<string, string> = {
  food: "খাবার",
  butcher: "কসাই",
  transport: "পরিবহন",
  medicine: "ওষুধ",
  other: "অন্যান্য",
};

export default function BatchDetailPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [meatSales, setMeatSales] = useState<MeatSale[]>([]);
  const [byproducts, setByproducts] = useState<ByproductSale[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profit, setProfit] = useState<ProfitCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"sales" | "overview">("sales");
  const [modal, setModal] = useState("");
  const [searchSales, setSearchSales] = useState("");
  const [collectAmt, setCollectAmt] = useState("");
  const [collectTarget, setCollectTarget] = useState<{
    name: string;
    total: number;
    paid: number;
    due: number;
    items: {
      id: string;
      type: string;
      due: number;
      paid: number;
      total: number;
    }[];
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    name: string;
    items: { id: string; type: string }[];
  } | null>(null);
  const [customerNames, setCustomerNames] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<"meat" | "byp" | "">(
    "",
  );
  const [saleType, setSaleType] = useState("meat");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fabOpen, setFabOpen] = useState(false);
  const meatInputRef = useRef<HTMLInputElement>(null);
  const bypInputRef = useRef<HTMLInputElement>(null);

  const [suggestionStyle, setSuggestionStyle] = useState<React.CSSProperties>({
    display: "none",
  });

  useEffect(() => {
    if (!showSuggestions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestionStyle({ display: "none" });
      return;
    }
    const ref = showSuggestions === "meat" ? meatInputRef : bypInputRef;
    const updatePosition = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setSuggestionStyle({
          position: "fixed",
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          zIndex: 9999,
          maxHeight: 180,
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [showSuggestions]);

  // Swipe gesture refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const tabKeys: ("sales" | "overview")[] = ["sales", "overview"];

  // Form states
  const [meatForm, setMeatForm] = useState({
    customerName: "",
    kgQuantity: "",
    pricePerKg: "",
    paidAmount: "",
    date: new Date().toISOString().split("T")[0],
    mergeIfExisting: true,
  });
  const [bypForm, setBypForm] = useState({
    itemType: "chamra",
    quantity: "1",
    price: "",
    buyerName: "",
    paidAmount: "",
    date: new Date().toISOString().split("T")[0],
    mergeIfExisting: true,
  });
  const [expForm, setExpForm] = useState({
    expenseType: "food",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editForm, setEditForm] = useState({
    batchName: "",
    purchaseDate: "",
    buyingCost: "",
    foodCost: "",
    butcherCost: "",
    transportCost: "",
    otherExpenses: "",
    baseMeatPricePerKg: "",
    totalMeatKg: "",
    status: "active",
    notes: "",
  });
  // Add this near your other useRef/useState at the top of the component
  const [iconSize, setIconSize] = useState(20);
  const [leftoverInput, setLeftoverInput] = useState("");

  useEffect(() => {
    const update = () => setIconSize(window.innerWidth < 768 ? 50 : 15);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/batches/${id}`);
      const json = await res.json();
      if (json.success) {
        const b = json.data.batch;
        setBatch(b);
        setMeatSales(json.data.meatSales);
        setByproducts(json.data.byproductSales);
        setExpenses(json.data.expenses);
        setProfit(json.data.profitData);
        if (b) {
          setMeatForm((f) => ({
            ...f,
            pricePerKg: String(b.baseMeatPricePerKg),
          }));
          setEditForm({
            batchName: b.batchName,
            purchaseDate: new Date(b.purchaseDate).toISOString().split("T")[0],
            buyingCost: String(b.buyingCost),
            foodCost: String(b.foodCost),
            butcherCost: String(b.butcherCost),
            transportCost: String(b.transportCost),
            otherExpenses: String(b.otherExpenses),
            baseMeatPricePerKg: String(b.baseMeatPricePerKg),
            totalMeatKg: String(b.totalMeatKg),
            status: b.status,
            notes: b.notes,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCustomerNames(j.data);
      })
      .catch(() => {});
  }, []);

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
    const res = await fetch(`/api/batches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("ব্যাচ আপডেট হয়েছে!");
      setModal("");
      fetchData();
    } else toast.error(json.error);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batch || !profit) return;
    const newTotalMeatKg = profit.totalKgSold + (Number(leftoverInput) || 0);
    const payload = {
      batchName: batch.batchName,
      purchaseDate: batch.purchaseDate,
      buyingCost: batch.buyingCost,
      foodCost: batch.foodCost,
      butcherCost: batch.butcherCost,
      transportCost: batch.transportCost,
      otherExpenses: batch.otherExpenses,
      baseMeatPricePerKg: batch.baseMeatPricePerKg,
      totalMeatKg: newTotalMeatKg,
      status: batch.status,
      notes: batch.notes,
    };
    const res = await fetch(`/api/batches/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("অবশিষ্ট গোশত ও মোট গোশত আপডেট হয়েছে!");
      setModal("");
      setLeftoverInput("");
      fetchData();
    } else {
      toast.error(json.error || "আপডেট করতে ব্যর্থ হয়েছে");
    }
  };

  const addMeatSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customerName: meatForm.customerName,
      kgQuantity: Number(meatForm.kgQuantity),
      pricePerKg: Number(meatForm.pricePerKg),
      paidAmount: Number(meatForm.paidAmount) || 0,
      date: meatForm.date,
      mergeIfExisting: meatForm.mergeIfExisting,
    };
    const res = await fetch(`/api/batches/${id}/meat-sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("গোশত বিক্রি যোগ/আপডেট হয়েছে");
      setModal("");
      setMeatForm({
        customerName: "",
        kgQuantity: "",
        pricePerKg: String(batch?.baseMeatPricePerKg || ""),
        paidAmount: "",
        date: new Date().toISOString().split("T")[0],
        mergeIfExisting: true,
      });
      fetchData();
      fetch("/api/customers")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setCustomerNames(j.data);
        });
    } else toast.error(json.error);
  };

  const addByproduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      itemType: saleType,
      quantity: Number(bypForm.quantity),
      price: Number(bypForm.price),
      buyerName: bypForm.buyerName,
      paidAmount: Number(bypForm.paidAmount) || 0,
      date: bypForm.date,
      mergeIfExisting: bypForm.mergeIfExisting,
    };
    const res = await fetch(`/api/batches/${id}/byproducts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("বিক্রি যোগ/আপডেট হয়েছে");
      setModal("");
      setBypForm({
        itemType: "chamra",
        quantity: "1",
        price: "",
        buyerName: "",
        paidAmount: "",
        date: new Date().toISOString().split("T")[0],
        mergeIfExisting: true,
      });
      fetchData();
      fetch("/api/customers")
        .then((r) => r.json())
        .then((j) => {
          if (j.success) setCustomerNames(j.data);
        });
    } else toast.error(json.error);
  };

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      expenseType: expForm.expenseType,
      amount: Number(expForm.amount),
      note: expForm.note,
      date: expForm.date,
    };
    const res = await fetch(`/api/batches/${id}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success) {
      toast.success("খরচ যোগ হয়েছে");
      setModal("");
      setExpForm({
        expenseType: "food",
        amount: "",
        note: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } else toast.error(json.error);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    for (const item of deleteTarget.items) {
      const url =
        item.type === "meat"
          ? `/api/batches/${id}/meat-sales/${item.id}`
          : `/api/batches/${id}/byproducts/${item.id}`;
      await fetch(url, { method: "DELETE" });
    }
    toast.success(`${deleteTarget.name} এর সব বিক্রি ডিলিট হয়েছে`);
    setDeleteTarget(null);
    fetchData();
  };

  const collectPayment = async () => {
    if (!collectTarget || !collectAmt) return;
    let remaining = Number(collectAmt);
    if (remaining <= 0) {
      toast.error("সঠিক পরিমাণ দিন");
      return;
    }
    // Distribute payment across items with due (FIFO)
    const itemsWithDue = collectTarget.items.filter((i) => i.due > 0);
    for (const item of itemsWithDue) {
      if (remaining <= 0) break;
      const applyAmt = Math.min(remaining, item.due);
      const newPaid = item.paid + applyAmt;
      const newDue = item.total - newPaid;
      const url =
        item.type === "meat"
          ? `/api/batches/${id}/meat-sales/${item.id}`
          : `/api/batches/${id}/byproducts/${item.id}`;
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: newPaid,
          dueAmount: newDue,
          totalPrice: item.total,
          total: item.total,
        }),
      });
      remaining -= applyAmt;
    }
    toast.success(
      `৳${Number(collectAmt)} আদায় হয়েছে ${collectTarget.name} থেকে`,
    );
    setCollectTarget(null);
    setCollectAmt("");
    fetchData();
  };

  const filteredMeat = meatSales.filter((s) =>
    s.customerName.toLowerCase().includes(searchSales.toLowerCase()),
  );
  const filteredByp = byproducts.filter((b) =>
    (b.buyerName || "").toLowerCase().includes(searchSales.toLowerCase()),
  );

  const getSuggestions = (query: string) => {
    if (!query || query.trim().length < 1) return [];
    const sanitize = (str: string) =>
      str.toLowerCase().replace(/[\s\u200C\u200D]+/g, "");
    const sanitizedQuery = sanitize(query);
    return customerNames
      .filter((n) => sanitize(n).includes(sanitizedQuery))
      .slice(0, 5);
  };

  const allDues = [
    ...meatSales
      .filter((s) => s.dueAmount > 0)
      .map((s) => ({
        id: s._id,
        name: s.customerName,
        type: "Meat",
        total: s.totalPrice,
        paid: s.paidAmount,
        due: s.dueAmount,
      })),
    ...byproducts
      .filter((b) => b.dueAmount > 0)
      .map((b) => ({
        id: b._id,
        name: b.buyerName || b.itemType,
        type: b.itemType,
        total: b.total,
        paid: b.paidAmount,
        due: b.dueAmount,
      })),
  ];

  if (loading) return <LoadingSpinner />;
  if (!batch || !profit)
    return (
      <div className="empty-state">
        <div className="empty-state-title">ব্যাচ পাওয়া যায়নি</div>
      </div>
    );

  const tabs: { key: "sales" | "overview"; label: string }[] = [
    {
      key: "sales",
      label: `🛒 বিক্রি (${meatSales.length + byproducts.length})`,
    },
    { key: "overview", label: "📊 সারসংক্ষেপ" },
  ];

  const handleDownloadPdf = async () => {
    const toastId = toast.loading("PDF তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন");

    try {
      document.body.classList.add("pdf-exporting");
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element =
        (document.querySelector(".animate-fade-in") as HTMLElement) ||
        document.body;

      interface HTML2PdfInstance {
        set: (opt: unknown) => HTML2PdfInstance;
        from: (el: HTMLElement) => HTML2PdfInstance;
        save: () => Promise<void>;
      }
      type HTML2PdfFunction = () => HTML2PdfInstance;

      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default as unknown as HTML2PdfFunction;

      const opt = {
        margin: [5, 8, 10, 8],
        filename: `${batch?.batchName || "Batch"}_Report.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1024,
          onclone: (clonedDoc: Document) => {
            // 1. Force white background on body
            const bodyStyle = (clonedDoc.body as HTMLElement).style;
            bodyStyle.setProperty(
              "background-color",
              "#ffffff",
              "important",
            );
            bodyStyle.setProperty("color", "#000000", "important");

            // 2. Inject CSS variable overrides so var(--text-*) resolves to black
            const styleEl = clonedDoc.createElement("style");
            styleEl.innerHTML = `
  :root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-card: #ffffff;
    --text-primary: #000000;
    --text-secondary: #000000;
    --text-muted: #000000;
    --border-color: #cccccc;
    --accent-green: #15803d;
    --accent-red: #b91c1c;
    --accent-blue: #1d4ed8;
    --accent-yellow: #b45309;
    --accent-purple: #6d28d9;
    --shadow-lg: none;
  }
  tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .print-header {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  .no-print { 
    display: none !important; 
    width: 0 !important; 
    height: 0 !important; 
    padding: 0 !important; 
    margin: 0 !important; 
    overflow: hidden !important; 
    border: none !important; 
  }
  .data-table { width: 100%; border-collapse: collapse; table-layout: auto; }
  .data-table th { 
    background-color: #f5f5f5 !important; 
    padding: 12px 14px !important; 
    text-align: left; 
    font-weight: 700;
    border-bottom: 2px solid #cccccc;
    vertical-align: middle !important;
    line-height: 1.45 !important;
    display: table-cell !important;
  }
  .data-table td { 
    padding: 12px 14px !important; 
    text-align: left;
    border-bottom: 1px solid #e5e5e5;
    vertical-align: middle !important;
    line-height: 1.45 !important;
    display: table-cell !important;
  }
  .data-table tfoot td { 
    background-color: #f5f5f5 !important; 
    font-weight: 700;
    border-top: 2px solid #cccccc;
    vertical-align: middle !important;
    line-height: 1.45 !important;
    padding: 12px 14px !important;
    display: table-cell !important;
  }
  .data-table tfoot td.tfoot-total {
    background-color: #e0f2fe !important; /* Soft light blue */
  }
  .data-table tfoot td.tfoot-paid {
    background-color: #dcfce7 !important; /* Soft light green */
  }
  .data-table tfoot td.tfoot-due {
    background-color: #fee2e2 !important; /* Soft light red */
  }
  .data-table td > div {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .badge {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 8px 0 0 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    display: inline-block !important;
    line-height: 1.45 !important;
    vertical-align: middle !important;
  }
  .badge:not(:last-child)::after {
    content: ", " !important;
  }
  .glass-card { 
    border: 1px solid #e0e0e0 !important; 
    border-radius: 8px !important;
    overflow: hidden !important;
    margin-bottom: 1rem !important;
    box-shadow: none !important;
  }
`;
            clonedDoc.head.appendChild(styleEl);

            // 3. Completely remove unwanted UI elements from cloned DOM
            [
              ".sticky-batch-header",
              ".desktop-batch-header",
              ".tab-nav",
              ".fab-container",
              ".no-print",
              ".mobile-sale-cards",
            ].forEach((sel: string) => {
              clonedDoc.querySelectorAll(sel).forEach((el: Element) => {
                el.remove();
              });
            });

            // 4. Show the print-only header
            clonedDoc.querySelectorAll(".print-header").forEach((el: Element) => {
              (el as HTMLElement).style.display = "block";
            });

            // 5. Walk every element:
            //    - Unconditionally force text to pure black
            //    - Fix dark backgrounds -> white using computed style safely
            clonedDoc.querySelectorAll("*").forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              // Force pure black text, except for paid and due values
              if (
                !el.classList.contains("tfoot-paid") &&
                !el.classList.contains("tfoot-due") &&
                !el.classList.contains("td-paid") &&
                !el.classList.contains("td-due")
              ) {
                htmlEl.style?.setProperty("color", "#000000", "important");
              } else if (el.classList.contains("tfoot-paid") || el.classList.contains("td-paid")) {
                htmlEl.style?.setProperty("color", "#15803d", "important"); // Dark green for PDF print
              } else if (el.classList.contains("tfoot-due") || el.classList.contains("td-due")) {
                htmlEl.style?.setProperty("color", "#b91c1c", "important"); // Dark red for PDF print
              }
              // Reset opacity — THIS is what was making text render as gray
              htmlEl.style?.setProperty("opacity", "1", "important");

              // Badges in PDF should not have backgrounds and should be clean plain text without borders/padding
              if (el.classList.contains("badge")) {
                htmlEl.style?.setProperty(
                  "background-color",
                  "transparent",
                  "important",
                );
                htmlEl.style?.setProperty("background", "transparent", "important");
                htmlEl.style?.setProperty("border", "none", "important");
                htmlEl.style?.setProperty("box-shadow", "none", "important");
                htmlEl.style?.setProperty("padding", "0", "important");
                htmlEl.style?.setProperty("margin", "0 8px 0 0", "important");
                htmlEl.style?.setProperty("display", "inline-block", "important");
                return;
              }

              // Fix dark backgrounds -> white safely
              try {
                const computed =
                  el.ownerDocument?.defaultView?.getComputedStyle(el) ||
                  window.getComputedStyle(el);
                const bg = computed?.backgroundColor;
                if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
                  const rgb = bg.match(/\d+/g)?.map(Number) || [];
                  if (rgb.length >= 3 && rgb[0] + rgb[1] + rgb[2] < 200) {
                    htmlEl.style?.setProperty(
                      "background-color",
                      "#ffffff",
                      "important",
                    );
                  }
                }
              } catch {
                // Ignore style computation errors on detached/cloned elements
              }
            });
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      await html2pdf().set(opt).from(element).save();

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
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "0.25rem",
            }}
          >
            সাকিব-রাকিব এন্টারপ্রাইজ
          </h1>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              marginBottom: "0.15rem",
            }}
          >
            {batch.batchName}
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            জবাইয়ের তারিখ:{" "}
            {formatBengaliDate(batch.purchaseDate, {
              day: "numeric",
              month: "long",
              includeYear: true,
            })}
          </p>
        </div>

        {/* Mobile Sticky Header */}
        <div className="sticky-batch-header">
          <div
            className="batch-title"
            style={{ justifyContent: "space-between", width: "100%" }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Link
                href="/batches"
                style={{ color: "var(--text-muted)", display: "flex" }}
              >
                <HiOutlineArrowLeft size={18} />
              </Link>
              {batch.batchName}
              <span
                className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`}
                style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}
              >
                {statusBn[batch.status] || batch.status}
              </span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {tab === "sales" && (
                <button
                  className="btn-icon"
                  onClick={handleDownloadPdf}
                  style={{ padding: "0.25rem", color: "var(--text-primary)" }}
                >
                  <HiOutlinePrinter size={iconSize} />
                </button>
              )}
              <button
                className="btn-icon"
                onClick={() => setModal("editBatch")}
                style={{ padding: "0.25rem", color: "var(--text-primary)" }}
              >
                <HiOutlinePencil size={iconSize} />
              </button>
            </div>
          </div>
          <div className="tab-nav">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Header */}
        <Link
          href="/batches"
          className="no-print desktop-batch-header"
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
          <HiOutlineArrowLeft size={16} /> ব্যাচ সমূহে ফিরুন
        </Link>
        <div
          className="no-print desktop-batch-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                marginBottom: "0.25rem",
              }}
            >
              {batch.batchName}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              ক্রয়ের তারিখ:{" "}
              {formatBengaliDate(batch.purchaseDate, {
                day: "numeric",
                month: "short",
                includeYear: true,
              })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {tab === "sales" && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadPdf}
              >
                <HiOutlinePrinter size={iconSize} /> PDF ডাউনলোড
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setModal("editBatch")}
            >
              <HiOutlinePencil size={iconSize} /> ইডিট করুন
            </button>

            <span
              className={`badge ${batch.status === "active" ? "badge-green" : "badge-blue"}`}
              style={{ fontSize: "0.85rem", padding: "0.35rem 1rem" }}
            >
              {statusBn[batch.status] || batch.status}
            </span>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div
          className="tab-nav desktop-tab-nav"
          style={{ marginBottom: "1.5rem" }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Swipeable content area */}
        <div
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  className={`stat-card ${profit.netProfit >= 0 ? "green" : "red"}`}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      opacity: 0.85,
                      marginBottom: "0.4rem",
                    }}
                  >
                    নিট লাভ
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    {fmt(profit.netProfit)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.7,
                      marginTop: "0.2rem",
                    }}
                  >
                    {toBengaliDigits(profit.profitMargin.toFixed(1))}% মার্জিন
                  </div>
                </div>
                <div className="stat-card blue">
                  <div
                    style={{
                      fontSize: "0.78rem",
                      opacity: 0.85,
                      marginBottom: "0.4rem",
                    }}
                  >
                    মোট আয়
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    {fmt(profit.totalRevenue)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.7,
                      marginTop: "0.2rem",
                    }}
                  >
                    গোশত + চামড়া/ভুঁড়ি/পা
                  </div>
                </div>
                <div className="stat-card purple">
                  <div
                    style={{
                      fontSize: "0.78rem",
                      opacity: 0.85,
                      marginBottom: "0.4rem",
                    }}
                  >
                    মোট খরচ
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    {fmt(profit.totalCost)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.7,
                      marginTop: "0.2rem",
                    }}
                  >
                    সব খরচ মিলিয়ে
                  </div>
                </div>
                <div className="stat-card yellow">
                  <div
                    style={{
                      fontSize: "0.78rem",
                      opacity: 0.85,
                      marginBottom: "0.4rem",
                    }}
                  >
                    মোট বাকি
                  </div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    {fmt(profit.totalDue)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      opacity: 0.7,
                      marginTop: "0.2rem",
                    }}
                  >
                    {fmt(profit.totalPaid)} আদায়
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {/* Revenue Breakdown */}
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      color: "var(--accent-green)",
                    }}
                  >
                    💵 আয়ের বিবরণ
                  </h3>
                  {[
                    { l: "গোশত বিক্রি", v: profit.totalMeatRevenue },
                    {
                      l: "চামড়া/ভুঁড়ি/পা বিক্রি",
                      v: profit.totalByproductRevenue,
                    },
                  ].map((r) => (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.65rem 0",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {r.l}
                      </span>
                      <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 0",
                      fontWeight: 700,
                      color: "var(--accent-green)",
                    }}
                  >
                    <span>মোট আয়</span>
                    <span>{fmt(profit.totalRevenue)}</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      color: "var(--accent-red)",
                    }}
                  >
                    📉 খরচের বিবরণ
                  </h3>
                  {[
                    { l: "ক্রয়মূল্য", v: profit.buyingCost },
                    { l: "খাবার খরচ", v: profit.foodCost },
                    { l: "কসাই খরচ", v: profit.butcherCost },
                    { l: "পরিবহন খরচ", v: profit.transportCost },
                    { l: "অন্যান্য খরচ", v: profit.otherExpenses },
                    { l: "অতিরিক্ত খরচ", v: profit.additionalExpenses },
                  ].map((r) => (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.65rem 0",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {r.l}
                      </span>
                      <span style={{ fontWeight: 600 }}>{fmt(r.v)}</span>
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.75rem 0",
                      fontWeight: 700,
                      color: "var(--accent-red)",
                    }}
                  >
                    <span>মোট খরচ</span>
                    <span>{fmt(profit.totalCost)}</span>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      color: "var(--accent-blue)",
                    }}
                  >
                    📦 স্টক ও মেট্রিক্স
                  </h3>
                  {(
                    [
                      {
                        l: "মোট গোশত",
                        v: `${toBengaliDigits(batch.totalMeatKg)} কেজি`,
                      },
                      {
                        l: "বিক্রি হয়েছে",
                        v: `${toBengaliDigits(profit.totalKgSold.toFixed(1))} কেজি`,
                      },
                      {
                        l: "বাকি আছে",
                        v: (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <span>{toBengaliDigits(profit.remainingKg.toFixed(1))} কেজি</span>
                            <button
                              onClick={() => {
                                setLeftoverInput(profit.remainingKg > 0 ? profit.remainingKg.toFixed(1) : "0");
                                setModal("adjustStock");
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--accent-blue)",
                                cursor: "pointer",
                                padding: "2px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "4px",
                                transition: "all 0.2s",
                              }}
                              title="স্টক সংশোধন করুন"
                              className="hover-scale"
                            >
                              <HiOutlinePencil size={14} />
                            </button>
                          </span>
                        ),
                      },
                      {
                        l: "স্টক মূল্য",
                        v: fmt(Math.round(profit.stockValue)),
                        color: "var(--accent-blue)",
                      },
                      {
                        l: "লাভ/কেজি",
                        v: (profit.profitPerKg >= 0 ? "+" : "") + fmt(Math.round(profit.profitPerKg)),
                        color: profit.profitPerKg >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                      },
                      { l: "বেস দাম/কেজি", v: fmt(batch.baseMeatPricePerKg) },
                      {
                        l: "আনুমানিক মোট লাভ",
                        v: (profit.projectedProfit >= 0 ? "+" : "") + fmt(Math.round(profit.projectedProfit)),
                        color: profit.projectedProfit >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                      },
                    ] as { l: string; v: string | React.ReactNode; color?: string }[]
                  ).map((r) => (
                    <div
                      key={r.l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.65rem 0",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.875rem",
                        }}
                      >
                        {r.l}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: r.color || "var(--text-primary)",
                        }}
                      >
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due List */}
              {allDues.length > 0 && (
                <div
                  className="glass-card"
                  style={{ padding: "1.5rem", marginTop: "1.25rem" }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      marginBottom: "1rem",
                      color: "var(--accent-yellow)",
                    }}
                  >
                    💳 বাকি তালিকা ({toBengaliDigits(allDues.length)})
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {allDues.map((d) => (
                      <div key={d.id} className="due-item">
                        <div>
                          <span
                            style={{ fontWeight: 600, marginRight: "0.5rem" }}
                          >
                            {d.name}
                          </span>
                          <span
                            className="badge badge-blue"
                            style={{ fontSize: "0.65rem" }}
                          >
                            {d.type}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--accent-red)",
                              fontWeight: 700,
                            }}
                          >
                            {fmt(d.due)}
                          </span>
                          <button
                            className="btn-collect"
                            onClick={() => {
                              setCollectTarget({
                                name: d.name,
                                total: d.total,
                                paid: d.paid,
                                due: d.due,
                                items: [
                                  {
                                    id: d.id,
                                    type:
                                      d.type === "Meat" ? "meat" : "byproduct",
                                    due: d.due,
                                    paid: d.paid,
                                    total: d.total,
                                  },
                                ],
                              });
                              setCollectAmt("");
                            }}
                          >
                            আদায়
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* UNIFIED SALES TAB */}
          {tab === "sales" &&
            (() => {
              // Build customer-grouped data
              const customerMap = new Map<
                string,
                {
                  name: string;
                  items: {
                    label: string;
                    type: "meat" | "byproduct";
                    id: string;
                    total: number;
                    paid: number;
                    due: number;
                    detail: string;
                  }[];
                  totalAmount: number;
                  totalPaid: number;
                  totalDue: number;
                }
              >();

              const normName = (n: string) => n.trim().toLowerCase();

              filteredMeat.forEach((s) => {
                const key = normName(s.customerName);
                if (!customerMap.has(key))
                  customerMap.set(key, {
                    name: s.customerName,
                    items: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                  });
                const c = customerMap.get(key)!;
                c.items.push({
                  label: `${toBengaliDigits(s.kgQuantity)} কেজি`,
                  type: "meat",
                  id: s._id,
                  total: s.totalPrice,
                  paid: s.paidAmount,
                  due: s.dueAmount,
                  detail: `${toBengaliDigits(s.kgQuantity)} কেজি × ${fmt(s.pricePerKg)}`,
                });
                c.totalAmount += s.totalPrice;
                c.totalPaid += s.paidAmount;
                c.totalDue += s.dueAmount;
              });

              filteredByp.forEach((b) => {
                const name = b.buyerName || b.itemType;
                const key = normName(name);
                if (!customerMap.has(key))
                  customerMap.set(key, {
                    name,
                    items: [],
                    totalAmount: 0,
                    totalPaid: 0,
                    totalDue: 0,
                  });
                const c = customerMap.get(key)!;
                c.items.push({
                  label: `${toBengaliDigits(b.quantity)} ${itemTypeBn[b.itemType] || b.itemType}`,
                  type: "byproduct",
                  id: b._id,
                  total: b.total,
                  paid: b.paidAmount,
                  due: b.dueAmount,
                  detail: `${toBengaliDigits(b.quantity)} × ${fmt(b.price)}`,
                });
                c.totalAmount += b.total;
                c.totalPaid += b.paidAmount;
                c.totalDue += b.dueAmount;
              });

              const customerRows = Array.from(customerMap.values()).sort(
                (a, b) => b.totalDue - a.totalDue,
              );
              const grandTotal = customerRows.reduce(
                (s, c) => s + c.totalAmount,
                0,
              );
              const grandPaid = customerRows.reduce(
                (s, c) => s + c.totalPaid,
                0,
              );
              const grandDue = customerRows.reduce((s, c) => s + c.totalDue, 0);
              const grandKgSold = filteredMeat.reduce(
                (sum, s) => sum + s.kgQuantity,
                0,
              );

              return (
                <div className="animate-fade-in">
                  <div
                    className="no-print"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <h3 style={{ fontWeight: 700 }}>সকল বিক্রি</h3>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      {(meatSales.length > 0 || byproducts.length > 0) && (
                        <div style={{ position: "relative" }}>
                          <HiOutlineSearch
                            size={16}
                            style={{
                              position: "absolute",
                              left: 10,
                              top: 9,
                              color: "var(--text-muted)",
                            }}
                          />
                          <input
                            className="form-input"
                            value={searchSales}
                            onChange={(e) => setSearchSales(e.target.value)}
                            placeholder="ক্রেতা খুঁজুন..."
                            style={{
                              paddingLeft: "2rem",
                              width: 180,
                              height: 36,
                              fontSize: "0.8rem",
                            }}
                          />
                        </div>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSaleType("meat");
                          setModal("sale");
                        }}
                      >
                        + বিক্রি যোগ করুন
                      </button>
                    </div>
                  </div>

                  {/* Unified Customer-Grouped Sales Table */}
                  <div className="glass-card" style={{ overflow: "auto" }}>
                    {customerRows.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        কোনো বিক্রি নেই
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <table className="data-table desktop-table">
                          <thead>
                            <tr>
                              <th>ক্রেতা</th>
                              <th>পরিমাণ</th>
                              <th>মোট</th>
                              <th>পেইড</th>
                              <th>বাকি</th>
                              <th className="no-print">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerRows.map((c) => (
                              <tr key={c.name}>
                                <td
                                  style={{
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {c.name}
                                </td>
                                <td>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "0.3rem",
                                    }}
                                  >
                                    {c.items.map((item, i) => (
                                      <span
                                        key={i}
                                        className={`badge ${item.type === "meat" ? "badge-green" : "badge-purple"}`}
                                        style={{ fontSize: "0.72rem" }}
                                      >
                                        {item.label}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td style={{ fontWeight: 700 }}>
                                  {fmt(c.totalAmount)}
                                </td>
                                <td
                                  style={{
                                    color: "var(--accent-green)",
                                    fontWeight: 600,
                                  }}
                                >
                                  {fmt(c.totalPaid)}
                                </td>
                                <td
                                  style={{
                                    color:
                                      c.totalDue > 0
                                        ? "var(--accent-red)"
                                        : "var(--accent-green)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {fmt(c.totalDue)}
                                </td>
                                <td className="no-print">
                                  <div className="action-group">
                                    {c.totalDue > 0 && (
                                      <button
                                        className="btn-collect"
                                        onClick={() => {
                                          setCollectTarget({
                                            name: c.name,
                                            total: c.totalAmount,
                                            paid: c.totalPaid,
                                            due: c.totalDue,
                                            items: c.items.map((i) => ({
                                              id: i.id,
                                              type: i.type,
                                              due: i.due,
                                              paid: i.paid,
                                              total: i.total,
                                            })),
                                          });
                                          setCollectAmt("");
                                        }}
                                      >
                                        আদায়
                                      </button>
                                    )}
                                    <button
                                      className="btn-icon"
                                      onClick={() =>
                                        setDeleteTarget({
                                          name: c.name,
                                          items: c.items.map((i) => ({
                                            id: i.id,
                                            type: i.type,
                                          })),
                                        })
                                      }
                                      style={{
                                        color: "var(--accent-red)",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td>
                                মোট ({toBengaliDigits(customerRows.length)} জন)
                              </td>
                              <td>
                                {toBengaliDigits(grandKgSold.toFixed(1))} কেজি
                              </td>
                              <td style={{ fontWeight: 700 }} className="tfoot-total">
                                {fmt(grandTotal)}
                              </td>
                              <td
                                style={{
                                  color: "var(--accent-green)",
                                  fontWeight: 700,
                                }}
                                className="tfoot-paid"
                              >
                                {fmt(grandPaid)}
                              </td>
                              <td
                                style={{
                                  color: "var(--accent-red)",
                                  fontWeight: 700,
                                }}
                                className="tfoot-due"
                              >
                                {fmt(grandDue)}
                              </td>
                              <td className="no-print"></td>
                            </tr>
                          </tfoot>
                        </table>
                        {/* Mobile Cards */}
                        <div className="mobile-sale-cards">
                          {customerRows.map((c) => (
                            <div key={c.name} className="sale-card">
                              <div className="sale-card-header">
                                <span className="sale-card-name">{c.name}</span>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.25rem",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {c.items.map((item, i) => (
                                    <span
                                      key={i}
                                      className={`badge ${item.type === "meat" ? "badge-green" : "badge-purple"}`}
                                      style={{ fontSize: "0.68rem" }}
                                    >
                                      {item.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="sale-card-grid">
                                <div className="sale-card-stat">
                                  <div className="sale-card-stat-label">
                                    মোট
                                  </div>
                                  <div className="sale-card-stat-value">
                                    {fmt(c.totalAmount)}
                                  </div>
                                </div>
                                <div className="sale-card-stat">
                                  <div className="sale-card-stat-label">
                                    পেইড
                                  </div>
                                  <div
                                    className="sale-card-stat-value"
                                    style={{ color: "var(--accent-green)" }}
                                  >
                                    {fmt(c.totalPaid)}
                                  </div>
                                </div>
                                <div className="sale-card-stat">
                                  <div className="sale-card-stat-label">
                                    বাকি
                                  </div>
                                  <div
                                    className="sale-card-stat-value"
                                    style={{
                                      color:
                                        c.totalDue > 0
                                          ? "var(--accent-red)"
                                          : "var(--accent-green)",
                                    }}
                                  >
                                    {fmt(c.totalDue)}
                                  </div>
                                </div>
                              </div>
                              <div className="sale-card-footer">
                                <span
                                  className="sale-card-kg"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {c.items.map((i) => i.detail).join(" + ")}
                                </span>
                                <div className="action-group">
                                  {c.totalDue > 0 && (
                                    <button
                                      className="btn-collect"
                                      onClick={() => {
                                        setCollectTarget({
                                          name: c.name,
                                          total: c.totalAmount,
                                          paid: c.totalPaid,
                                          due: c.totalDue,
                                          items: c.items.map((i) => ({
                                            id: i.id,
                                            type: i.type,
                                            due: i.due,
                                            paid: i.paid,
                                            total: i.total,
                                          })),
                                        });
                                        setCollectAmt("");
                                      }}
                                    >
                                      আদায়
                                    </button>
                                  )}
                                  <button
                                    className="btn-icon"
                                    onClick={() =>
                                      setDeleteTarget({
                                        name: c.name,
                                        items: c.items.map((i) => ({
                                          id: i.id,
                                          type: i.type,
                                        })),
                                      })
                                    }
                                    style={{
                                      color: "var(--accent-red)",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div
                            style={{
                              padding: "0.5rem",
                              background: "rgba(16,185,129,0.06)",
                              borderRadius: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                            }}
                          >
                            <span>
                              মোট: {toBengaliDigits(customerRows.length)} জন
                              কাস্টমার
                            </span>
                            <span>{fmt(grandTotal)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
        </div>
        {/* end swipe area */}

        {/* FAB for mobile */}
        {tab === "sales" && (
          <div className="fab-container">
            <button className="fab-btn" onClick={() => setModal("sale")}>
              <HiPlus />
            </button>
          </div>
        )}

        {/* UNIFIED SALE MODAL */}
        <Modal
          isOpen={modal === "sale"}
          onClose={() => {
            setModal("");
            setShowSuggestions("");
          }}
          title="বিক্রি যোগ করুন"
        >
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              { k: "meat", l: "🥩 গোশত" },
              { k: "chamra", l: "চামড়া" },
              { k: "vuri", l: "ভুঁড়ি" },
              { k: "pa", l: "পা" },
              { k: "other", l: "অন্যান্য" },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                className={`tab-btn ${saleType === t.k ? "active" : ""}`}
                style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem" }}
                onClick={() => setSaleType(t.k)}
              >
                {t.l}
              </button>
            ))}
          </div>

          {saleType === "meat" ? (
            <form onSubmit={addMeatSale}>
              <div className="form-group">
                <label className="form-label">ক্রেতার নাম *</label>
                <input
                  ref={meatInputRef}
                  className="form-input"
                  value={meatForm.customerName}
                  onChange={(e) => {
                    setMeatForm({ ...meatForm, customerName: e.target.value });
                    setShowSuggestions("meat");
                  }}
                  onFocus={() => setShowSuggestions("meat")}
                  onBlur={() => setTimeout(() => setShowSuggestions(""), 200)}
                  required
                  autoComplete="off"
                />
                {showSuggestions === "meat" &&
                  getSuggestions(meatForm.customerName).length > 0 &&
                  typeof window !== "undefined" &&
                  createPortal(
                    <div style={suggestionStyle}>
                      {getSuggestions(meatForm.customerName).map((n) => (
                        <div
                          key={n}
                          style={{
                            padding: "0.65rem 0.85rem",
                            cursor: "pointer",
                            fontSize: "0.88rem",
                            borderBottom: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                          onMouseDown={() => {
                            setMeatForm({ ...meatForm, customerName: n });
                            setShowSuggestions("");
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>,
                    document.body,
                  )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">পরিমাণ (কেজি) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={meatForm.kgQuantity}
                    onChange={(e) =>
                      setMeatForm({ ...meatForm, kgQuantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">দাম/কেজি (৳)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={meatForm.pricePerKg}
                    onChange={(e) =>
                      setMeatForm({ ...meatForm, pricePerKg: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">পেইড (৳)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={meatForm.paidAmount}
                    onChange={(e) =>
                      setMeatForm({ ...meatForm, paidAmount: e.target.value })
                    }
                    placeholder="না দিলে ০"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">তারিখ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={meatForm.date}
                    onChange={(e) =>
                      setMeatForm({ ...meatForm, date: e.target.value })
                    }
                  />
                </div>
              </div>
              {meatForm.kgQuantity && meatForm.pricePerKg && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  মোট:{" "}
                  <strong>
                    {fmt(
                      Number(meatForm.kgQuantity) * Number(meatForm.pricePerKg),
                    )}
                  </strong>{" "}
                  | বাকি:{" "}
                  <strong style={{ color: "var(--accent-yellow)" }}>
                    {fmt(
                      Number(meatForm.kgQuantity) *
                        Number(meatForm.pricePerKg) -
                        (Number(meatForm.paidAmount) || 0),
                    )}
                  </strong>
                </div>
              )}
              {meatSales.some(
                (s) =>
                  s.customerName.toLowerCase() ===
                  meatForm.customerName.toLowerCase().trim(),
              ) && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={meatForm.mergeIfExisting}
                    onChange={(e) =>
                      setMeatForm({
                        ...meatForm,
                        mergeIfExisting: e.target.checked,
                      })
                    }
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>এই ক্রেতার আগের গোশত বিক্রির সাথে যুক্ত করুন</span>
                </label>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                বিক্রি যোগ করুন
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                setBypForm((f) => ({ ...f, itemType: saleType }));
                addByproduct(e);
              }}
            >
              <input type="hidden" value={saleType} />
              <div className="form-group">
                <label className="form-label">ক্রেতার নাম *</label>
                <input
                  ref={bypInputRef}
                  className="form-input"
                  value={bypForm.buyerName}
                  onChange={(e) => {
                    setBypForm({ ...bypForm, buyerName: e.target.value });
                    setShowSuggestions("byp");
                  }}
                  onFocus={() => setShowSuggestions("byp")}
                  onBlur={() => setTimeout(() => setShowSuggestions(""), 200)}
                  placeholder="ক্রেতার নাম"
                  required
                  autoComplete="off"
                />
                {showSuggestions === "byp" &&
                  getSuggestions(bypForm.buyerName).length > 0 &&
                  typeof window !== "undefined" &&
                  createPortal(
                    <div style={suggestionStyle}>
                      {getSuggestions(bypForm.buyerName).map((n) => (
                        <div
                          key={n}
                          style={{
                            padding: "0.65rem 0.85rem",
                            cursor: "pointer",
                            fontSize: "0.88rem",
                            borderBottom: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                          }}
                          onMouseDown={() => {
                            setBypForm({ ...bypForm, buyerName: n });
                            setShowSuggestions("");
                          }}
                        >
                          {n}
                        </div>
                      ))}
                    </div>,
                    document.body,
                  )}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">পরিমাণ</label>
                  <input
                    type="number"
                    className="form-input"
                    value={bypForm.quantity}
                    onChange={(e) =>
                      setBypForm({ ...bypForm, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">দাম (৳) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={bypForm.price}
                    onChange={(e) =>
                      setBypForm({ ...bypForm, price: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">পেইড (৳)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={bypForm.paidAmount}
                    onChange={(e) =>
                      setBypForm({ ...bypForm, paidAmount: e.target.value })
                    }
                    placeholder="না দিলে ০"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">তারিখ</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bypForm.date}
                    onChange={(e) =>
                      setBypForm({ ...bypForm, date: e.target.value })
                    }
                  />
                </div>
              </div>
              {bypForm.price && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  মোট:{" "}
                  <strong>
                    {fmt(Number(bypForm.quantity || 1) * Number(bypForm.price))}
                  </strong>{" "}
                  | বাকি:{" "}
                  <strong style={{ color: "var(--accent-yellow)" }}>
                    {fmt(
                      Number(bypForm.quantity || 1) * Number(bypForm.price) -
                        (Number(bypForm.paidAmount) || 0),
                    )}
                  </strong>
                </div>
              )}
              {byproducts.some(
                (b) =>
                  (b.buyerName || "").toLowerCase() ===
                    bypForm.buyerName.toLowerCase().trim() &&
                  b.itemType === saleType,
              ) && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bypForm.mergeIfExisting}
                    onChange={(e) =>
                      setBypForm({
                        ...bypForm,
                        mergeIfExisting: e.target.checked,
                      })
                    }
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>এই ক্রেতার আগের বিক্রির সাথে যুক্ত করুন</span>
                </label>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                বিক্রি যোগ করুন
              </button>
            </form>
          )}
        </Modal>

        <Modal
          isOpen={modal === "expense"}
          onClose={() => setModal("")}
          title="খরচ যোগ করুন"
        >
          <form onSubmit={addExpense}>
            <div className="form-group">
              <label className="form-label">খরচের ধরন *</label>
              <select
                className="form-select"
                value={expForm.expenseType}
                onChange={(e) =>
                  setExpForm({ ...expForm, expenseType: e.target.value })
                }
              >
                <option value="food">খাবার</option>
                <option value="butcher">কসাই</option>
                <option value="transport">পরিবহন</option>
                <option value="medicine">ওষুধ</option>
                <option value="other">অন্যান্য</option>
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">পরিমাণ (৳) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={expForm.amount}
                  onChange={(e) =>
                    setExpForm({ ...expForm, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">তারিখ</label>
                <input
                  type="date"
                  className="form-input"
                  value={expForm.date}
                  onChange={(e) =>
                    setExpForm({ ...expForm, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">নোট</label>
              <input
                className="form-input"
                value={expForm.note}
                onChange={(e) =>
                  setExpForm({ ...expForm, note: e.target.value })
                }
                placeholder="ঐচ্ছিক নোট"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              খরচ যোগ করুন
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={modal === "editBatch"}
          onClose={() => setModal("")}
          title="ব্যাচের তথ্য ইডিট করুন"
        >
          <form onSubmit={updateBatch}>
            <div className="form-group">
              <label className="form-label">ব্যাচের নাম *</label>
              <input
                className="form-input"
                value={editForm.batchName}
                onChange={(e) =>
                  setEditForm({ ...editForm, batchName: e.target.value })
                }
                required
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">ক্রয়ের তারিখ</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.purchaseDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, purchaseDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">মোট গোশত (কেজি)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={editForm.totalMeatKg}
                  onChange={(e) =>
                    setEditForm({ ...editForm, totalMeatKg: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">ক্রয়মূল্য (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.buyingCost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, buyingCost: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">খাবার খরচ (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.foodCost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, foodCost: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">কসাই খরচ (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.butcherCost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, butcherCost: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">পরিবহন খরচ (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.transportCost}
                  onChange={(e) =>
                    setEditForm({ ...editForm, transportCost: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">অন্যান্য খরচ (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.otherExpenses}
                  onChange={(e) =>
                    setEditForm({ ...editForm, otherExpenses: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">বেস দাম/কেজি (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.baseMeatPricePerKg}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      baseMeatPricePerKg: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div className="form-group">
                <label className="form-label">স্ট্যাটাস</label>
                <select
                  className="form-select"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="active">চলমান</option>
                  <option value="completed">সম্পন্ন</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">নোট</label>
              <textarea
                className="form-input"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                rows={2}
                style={{ resize: "vertical" }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              সেইভ করুন
            </button>
          </form>
        </Modal>

        <Modal
          isOpen={modal === "adjustStock"}
          onClose={() => setModal("")}
          title="অবশিষ্ট গোশত (স্টক) সংশোধন"
        >
          {profit && (
            <form onSubmit={handleAdjustStock}>
              <div
                style={{
                  padding: "1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "10px",
                  marginBottom: "1.25rem",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>ইতিমধ্যে বিক্রি হয়েছে:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {toBengaliDigits(profit.totalKgSold.toFixed(1))} কেজি
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>বর্তমান মোট গোশত:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {toBengaliDigits((batch?.totalMeatKg || 0).toFixed(1))} কেজি
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>হিসাবকৃত অবশিষ্ট:</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {toBengaliDigits(profit.remainingKg.toFixed(1))} কেজি
                  </span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: "0.5rem", display: "block" }}>
                  বাস্তবে ফ্রিজে থাকা অবশিষ্ট গোশতের পরিমাণ (কেজি) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="যেমন: ১৫.৫"
                  value={leftoverInput}
                  onChange={(e) => setLeftoverInput(e.target.value)}
                  required
                  style={{ width: "100%" }}
                />
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: "10px",
                  marginBottom: "1.5rem",
                  fontSize: "0.95rem",
                  color: "var(--accent-green)",
                  fontWeight: 600,
                  textAlign: "center",
                }}
              >
                নতুন মোট গোশত হবে:{" "}
                {toBengaliDigits(
                  (profit.totalKgSold + (Number(leftoverInput) || 0)).toFixed(1)
                )}{" "}
                কেজি
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setModal("")}
                  style={{
                    flex: 1,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Collect Payment Modal */}
        <Modal
          isOpen={!!collectTarget}
          onClose={() => setCollectTarget(null)}
          title="টাকা আদায়"
        >
          {collectTarget && (
            <div>
              <div
                style={{
                  padding: "1rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "10px",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>ক্রেতা</span>
                  <span style={{ fontWeight: 700 }}>{collectTarget.name}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>মোট</span>
                  <span style={{ fontWeight: 600 }}>
                    {fmt(collectTarget.total)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    আগে দিয়েছে
                  </span>
                  <span
                    style={{ color: "var(--accent-green)", fontWeight: 600 }}
                  >
                    {fmt(collectTarget.paid)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "var(--text-muted)" }}>বাকি আছে</span>
                  <span
                    style={{
                      color: "var(--accent-red)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {fmt(collectTarget.due)}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">এখন কত আদায় করছেন (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  value={collectAmt}
                  onChange={(e) => setCollectAmt(e.target.value)}
                  placeholder={`সর্বোচ্চ ${collectTarget.due}`}
                  max={collectTarget.due}
                  autoFocus
                />
              </div>
              {collectAmt && Number(collectAmt) > 0 && (
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    borderRadius: "10px",
                    marginBottom: "1rem",
                    fontSize: "0.85rem",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  আদায়ের পর: পেইড ={" "}
                  <strong style={{ color: "var(--accent-green)" }}>
                    {fmt(collectTarget.paid + Number(collectAmt))}
                  </strong>{" "}
                  | বাকি ={" "}
                  <strong
                    style={{
                      color:
                        Number(collectAmt) >= collectTarget.due
                          ? "var(--accent-green)"
                          : "var(--accent-yellow)",
                    }}
                  >
                    {fmt(collectTarget.due - Number(collectAmt))}
                  </strong>
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={collectPayment}
                disabled={!collectAmt || Number(collectAmt) <= 0}
              >
                টাকা আদায় করুন
              </button>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="ডিলিট নিশ্চিত করুন"
          confirmText="ডিলিট"
          confirmColor="danger"
        >
          <p>
            আপনি কি নিশ্চিত <strong>{deleteTarget?.name}</strong> ডিলিট করতে
            চান?
          </p>
          <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.7 }}>
            এই কাজটি ফেরত নেওয়া যাবে না।
          </p>
        </ConfirmModal>
      </div>
    </PullToRefresh>
  );
}
