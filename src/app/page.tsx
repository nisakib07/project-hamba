import DashboardClient from "@/components/DashboardClient";
import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import Expense from "@/models/Expense";

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

async function getDashboardData(): Promise<DashboardData> {
  await dbConnect();

  const batches = await CowBatch.find({}).sort({ createdAt: -1 }).lean();
  const batchIds = batches.map((batch: any) => batch._id);

  const [meatGroups, byproductGroups, expenseGroups] = await Promise.all([
    MeatSale.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      {
        $group: {
          _id: "$batchId",
          revenue: { $sum: "$totalPrice" },
          kgSold: { $sum: "$kgQuantity" },
          paid: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
        },
      },
    ]),
    ByproductSale.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      {
        $group: {
          _id: "$batchId",
          revenue: { $sum: "$total" },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { batchId: { $in: batchIds } } },
      {
        $group: {
          _id: "$batchId",
          amount: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const meatMap = new Map(meatGroups.map((item: any) => [item._id.toString(), item]));
  const byproductMap = new Map(byproductGroups.map((item: any) => [item._id.toString(), item]));
  const expenseMap = new Map(expenseGroups.map((item: any) => [item._id.toString(), item]));

  let totalRevenue = 0;
  let totalCost = 0;
  let totalKgSold = 0;
  let totalPaid = 0;
  let totalDue = 0;
  const activeBatches = batches.filter((batch: any) => batch.status === "active").length;

  const batchSummaries: BatchSummary[] = [];

  for (const batch of batches) {
    const batchId = batch._id.toString();
    const meatStats = meatMap.get(batchId) ?? { revenue: 0, kgSold: 0, paid: 0, due: 0 };
    const byproductStats = byproductMap.get(batchId) ?? { revenue: 0 };
    const expenseStats = expenseMap.get(batchId) ?? { amount: 0 };

    const batchRevenue = meatStats.revenue + byproductStats.revenue;
    const batchCost =
      batch.buyingCost +
      batch.foodCost +
      batch.butcherCost +
      batch.transportCost +
      batch.otherExpenses +
      expenseStats.amount;

    totalRevenue += batchRevenue;
    totalCost += batchCost;
    totalKgSold += meatStats.kgSold;
    totalPaid += meatStats.paid;
    totalDue += meatStats.due;

    batchSummaries.push({
      _id: batchId,
      batchName: batch.batchName,
      status: batch.status,
      purchaseDate: batch.purchaseDate instanceof Date ? batch.purchaseDate.toISOString() : batch.purchaseDate,
      revenue: batchRevenue,
      cost: batchCost,
      profit: batchRevenue - batchCost,
      kgSold: meatStats.kgSold,
      totalMeatKg: batch.totalMeatKg,
      createdAt: batch.createdAt instanceof Date ? batch.createdAt.toISOString() : batch.createdAt,
    });
  }

  return {
    totalBatches: batches.length,
    activeBatches,
    totalRevenue,
    totalCost,
    netProfit: totalRevenue - totalCost,
    totalKgSold,
    totalPaid,
    totalDue,
    batchSummaries,
  };
}

async function getCustomerNames(): Promise<string[]> {
  await dbConnect();

  const [meatNames, bypNames] = await Promise.all([
    MeatSale.distinct("customerName"),
    ByproductSale.distinct("buyerName"),
  ]);

  return [...new Set([...meatNames, ...bypNames])]
    .filter((name) => typeof name === "string" && name.trim())
    .sort((a, b) => a.localeCompare(b, "bn"));
}

export default async function DashboardPage() {
  const [data, customers] = await Promise.all([getDashboardData(), getCustomerNames()]);

  return <DashboardClient data={data} customers={customers} />;
}
