import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";
import CowBatch from "@/models/CowBatch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/batches/[id]/meat-sales
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const sales = await MeatSale.find({ batchId: id }).sort({ date: -1 });
    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/batches/[id]/meat-sales
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    // Verify batch exists
    const batch = await CowBatch.findById(id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    body.batchId = id;

    // Auto-fill pricePerKg from batch if not provided
    if (!body.pricePerKg) {
      body.pricePerKg = batch.baseMeatPricePerKg;
    }

    // Calculate derived fields
    const currentTotalPrice = body.kgQuantity * body.pricePerKg;
    const currentPaidAmount = body.paidAmount || 0;
    const currentDueAmount = currentTotalPrice - currentPaidAmount;

    if (body.mergeIfExisting) {
      const existingSale = await MeatSale.findOne({ batchId: id, customerName: body.customerName });
      if (existingSale) {
        existingSale.kgQuantity += body.kgQuantity;
        existingSale.totalPrice += currentTotalPrice;
        existingSale.paidAmount += currentPaidAmount;
        existingSale.dueAmount = existingSale.totalPrice - existingSale.paidAmount;
        // We leave pricePerKg as it was initially, or we could calculate a weighted average. 
        // For simplicity, we just keep the original or update if needed.
        await existingSale.save();
        return NextResponse.json({ success: true, data: existingSale }, { status: 200 });
      }
    }

    body.totalPrice = currentTotalPrice;
    body.dueAmount = currentDueAmount;

    const sale = await MeatSale.create(body);
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
