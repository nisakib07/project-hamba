import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import CowBatch from "@/models/CowBatch";
import { toBengaliDigits, itemTypeBn } from "@/lib/bnUtils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);

    await dbConnect();

    // Ensure models are registered for populate
    CowBatch.init();

    const [meatSales, byproductSales] = await Promise.all([
      MeatSale.find({ customerName: name }).populate("batchId", "batchName").sort({ date: -1, createdAt: -1 }),
      ByproductSale.find({ buyerName: name }).populate("batchId", "batchName").sort({ date: -1, createdAt: -1 }),
    ]);

    // Format data for response
    const formattedMeatSales = meatSales.map(sale => ({
      _id: sale._id,
      batchId: sale.batchId._id,
      batchName: (sale.batchId as any).batchName,
      type: "meat",
      detail: `${toBengaliDigits(sale.kgQuantity)} কেজি গোশত (প্রতি কেজি ৳${toBengaliDigits(sale.pricePerKg)})`,
      total: sale.totalPrice,
      paid: sale.paidAmount,
      due: sale.dueAmount,
      date: sale.date || sale.createdAt
    }));

    const formattedByproductSales = byproductSales.map(sale => ({
      _id: sale._id,
      batchId: sale.batchId._id,
      batchName: (sale.batchId as any).batchName,
      type: sale.itemType,
      detail: `${toBengaliDigits(sale.quantity)}টি ${itemTypeBn[sale.itemType] || sale.itemType || "অন্যান্য"} (৳${toBengaliDigits(sale.price)})`,
      total: sale.total,
      paid: sale.paidAmount,
      due: sale.dueAmount,
      date: sale.date || sale.createdAt
    }));

    const allPurchases = [...formattedMeatSales, ...formattedByproductSales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPurchased = allPurchases.reduce((sum, item) => sum + item.total, 0);
    const totalPaid = allPurchases.reduce((sum, item) => sum + item.paid, 0);
    const totalDue = allPurchases.reduce((sum, item) => sum + item.due, 0);

    return NextResponse.json({
      success: true,
      data: {
        name,
        totalPurchased,
        totalPaid,
        totalDue,
        history: allPurchases
      }
    });

  } catch (error) {
    console.error("Error fetching customer details:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customer details" }, { status: 500 });
  }
}
