import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import Expense from "@/models/Expense";

export interface BatchSummary {
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

export interface DashboardData {
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

export async function getDashboardData(): Promise<DashboardData> {
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
          paid: { $sum: "$paidAmount" },
          due: { $sum: "$dueAmount" },
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
    const batchId = (batch as any)._id.toString();
    const meatStats = meatMap.get(batchId) ?? { revenue: 0, kgSold: 0, paid: 0, due: 0 };
    const byproductStats = byproductMap.get(batchId) ?? { revenue: 0, paid: 0, due: 0 };
    const expenseStats = expenseMap.get(batchId) ?? { amount: 0 };

    const batchRevenue = meatStats.revenue + byproductStats.revenue;
    const batchCost =
      (batch as any).buyingCost +
      (batch as any).foodCost +
      (batch as any).butcherCost +
      (batch as any).transportCost +
      (batch as any).otherExpenses +
      expenseStats.amount;

    totalRevenue += batchRevenue;
    totalCost += batchCost;
    totalKgSold += meatStats.kgSold;
    totalPaid += meatStats.paid + byproductStats.paid;
    totalDue += meatStats.due + byproductStats.due;

    batchSummaries.push({
      _id: batchId,
      batchName: (batch as any).batchName,
      status: (batch as any).status,
      purchaseDate: (batch as any).purchaseDate instanceof Date ? (batch as any).purchaseDate.toISOString() : (batch as any).purchaseDate,
      revenue: batchRevenue,
      cost: batchCost,
      profit: batchRevenue - batchCost,
      kgSold: meatStats.kgSold,
      totalMeatKg: (batch as any).totalMeatKg,
      createdAt: (batch as any).createdAt instanceof Date ? (batch as any).createdAt.toISOString() : (batch as any).createdAt,
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

export async function getCustomerNames(): Promise<string[]> {
  await dbConnect();

  const [meatNames, bypNames] = await Promise.all([
    MeatSale.distinct("customerName"),
    ByproductSale.distinct("buyerName"),
  ]);

  return [...new Set([...meatNames, ...bypNames])]
    .filter((name) => typeof name === "string" && name.trim())
    .sort((a, b) => a.localeCompare(b, "bn"));
}
