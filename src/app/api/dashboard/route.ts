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

    const batches = await CowBatch.find({}).sort({ createdAt: -1 });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalKgSold = 0;
    let totalPaid = 0;
    let totalDue = 0;
    const activeBatches = batches.filter((b) => b.status === "active").length;

    const batchSummaries = [];

    for (const batch of batches) {
      const meatSales = await MeatSale.find({ batchId: batch._id });
      const byproductSales = await ByproductSale.find({ batchId: batch._id });
      const expenses = await Expense.find({ batchId: batch._id });

      const meatRevenue = meatSales.reduce((s, m) => s + m.totalPrice, 0);
      const byproductRevenue = byproductSales.reduce((s, b) => s + b.total, 0);
      const batchRevenue = meatRevenue + byproductRevenue;

      const additionalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const batchCost =
        batch.buyingCost +
        batch.foodCost +
        batch.butcherCost +
        batch.transportCost +
        batch.otherExpenses +
        additionalExpenses;

      const batchKgSold = meatSales.reduce((s, m) => s + m.kgQuantity, 0);
      const batchPaid = meatSales.reduce((s, m) => s + m.paidAmount, 0);
      const batchDueAmount = meatSales.reduce((s, m) => s + m.dueAmount, 0);

      totalRevenue += batchRevenue;
      totalCost += batchCost;
      totalKgSold += batchKgSold;
      totalPaid += batchPaid;
      totalDue += batchDueAmount;

      batchSummaries.push({
        _id: batch._id,
        batchName: batch.batchName,
        status: batch.status,
        purchaseDate: batch.purchaseDate,
        revenue: batchRevenue,
        cost: batchCost,
        profit: batchRevenue - batchCost,
        kgSold: batchKgSold,
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
