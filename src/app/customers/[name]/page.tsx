import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import CustomerDashboardClient from "@/components/CustomerDashboardClient";
import { toBengaliDigits, itemTypeBn } from "@/lib/bnUtils";

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

async function getCustomerData(name: string): Promise<CustomerData> {
  await dbConnect();

  const meatSales = await MeatSale.find({ customerName: name }).lean();
  const byproductSales = await ByproductSale.find({ buyerName: name }).lean();

  const history = [
    ...meatSales.map((sale: any) => ({
      _id: sale._id.toString(),
      batchId: sale.batchId.toString(),
      batchName: sale.batchName,
      type: "meat",
      detail: `${toBengaliDigits(sale.kgQuantity)} কেজি গোশত (প্রতি কেজি ৳${toBengaliDigits(sale.pricePerKg)})`,
      total: sale.totalPrice,
      paid: sale.paidAmount,
      due: sale.dueAmount,
      date: sale.date instanceof Date ? sale.date.toISOString() : sale.date,
    })),
    ...byproductSales.map((item: any) => ({
      _id: item._id.toString(),
      batchId: item.batchId.toString(),
      batchName: item.batchName,
      type: item.itemType || "other",
      detail: `${toBengaliDigits(item.quantity)}টি ${itemTypeBn[item.itemType] || item.itemType || "অন্যান্য"} (৳${toBengaliDigits(item.price)})`,
      total: item.total,
      paid: item.paidAmount,
      due: item.dueAmount,
      date: item.date instanceof Date ? item.date.toISOString() : item.date,
    })),

  ];

  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPurchased = history.reduce((sum, item) => sum + item.total, 0);
  const totalPaid = history.reduce((sum, item) => sum + item.paid, 0);
  const totalDue = history.reduce((sum, item) => sum + item.due, 0);

  return {
    name,
    totalPurchased,
    totalPaid,
    totalDue,
    history,
  };
}

export default async function CustomerDashboardPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const customerName = decodeURIComponent(resolvedParams.name);
  const data = await getCustomerData(customerName);
  return <CustomerDashboardClient customerName={customerName} data={data} />;
}

