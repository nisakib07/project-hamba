import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const resolvedParams = await params;
    const name = decodeURIComponent(resolvedParams.name);
    
    const body = await request.json();
    const { amount } = body;

    const parsedAmount = Number(amount);
    if (amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payment amount" }, { status: 400 });
    }

    await dbConnect();

    // Fetch all records with dues for this customer, sorted chronologically (oldest first)
    const [meatSales, byproductSales] = await Promise.all([
      MeatSale.find({ customerName: name, dueAmount: { $gt: 0 } }).sort({ date: 1, createdAt: 1 }),
      ByproductSale.find({ buyerName: name, dueAmount: { $gt: 0 } }).sort({ date: 1, createdAt: 1 }),
    ]);

    // Combine and sort all unpaid records by date
    const allUnpaidRecords = [...meatSales, ...byproductSales].sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    let remainingPayment = parsedAmount;
    const updatedRecords = [];

    // Apply FIFO logic
    for (const record of allUnpaidRecords) {
      if (remainingPayment <= 0) break;

      const paymentToApply = Math.min(remainingPayment, record.dueAmount);
      
      record.paidAmount += paymentToApply;
      record.dueAmount -= paymentToApply;
      remainingPayment -= paymentToApply;

      await record.save();
      updatedRecords.push(record);
    }

    if (remainingPayment > 0) {
      console.warn(`Payment of ${parsedAmount} for ${name} exceeded total dues by ${remainingPayment}`);
      // In a real system, you might want to log an advance payment or credit balance,
      // but for this implementation, we simply apply up to the total due.
    }

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      appliedAmount: parsedAmount - remainingPayment,
      excessAmount: remainingPayment,
      updatedRecordsCount: updatedRecords.length
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ success: false, error: "Failed to process payment" }, { status: 500 });
  }
}
