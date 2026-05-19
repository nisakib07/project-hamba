import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import Expense from "@/models/Expense";

// GET /api/dashboard — Aggregated dashboard stats
export async function GET() {
  try {
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

    const batchSummaries = [];

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
        _id: batch._id,
        batchName: batch.batchName,
        status: batch.status,
        purchaseDate: batch.purchaseDate,
        revenue: batchRevenue,
        cost: batchCost,
        profit: batchRevenue - batchCost,
        kgSold: meatStats.kgSold,
        totalMeatKg: batch.totalMeatKg,
        createdAt: batch.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalBatches: batches.length,
        activeBatches,
        totalRevenue,
        totalCost,
        netProfit: totalRevenue - totalCost,
        totalKgSold,
        totalPaid,
        totalDue,
        batchSummaries,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
