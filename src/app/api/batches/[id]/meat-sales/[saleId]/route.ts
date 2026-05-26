import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";

interface RouteParams {
  params: Promise<{ id: string; saleId: string }>;
}

// PUT /api/batches/[id]/meat-sales/[saleId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id, saleId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(saleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Find the existing sale and verify it belongs to this batch
    const sale = await MeatSale.findOne({ _id: saleId, batchId: id });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found in this batch" },
        { status: 404 }
      );
    }

    // Apply whitelisted updates
    if (body.kgQuantity !== undefined) sale.kgQuantity = Number(body.kgQuantity);
    if (body.pricePerKg !== undefined) sale.pricePerKg = Number(body.pricePerKg);
    if (body.paidAmount !== undefined) sale.paidAmount = Number(body.paidAmount);
    if (body.customerName !== undefined) sale.customerName = body.customerName;
    if (body.date !== undefined) sale.date = body.date;

    // Recalculate derived fields (always, to keep consistency)
    sale.totalPrice = body.totalPrice !== undefined ? Number(body.totalPrice) : sale.kgQuantity * sale.pricePerKg;
    sale.dueAmount = body.dueAmount !== undefined ? Number(body.dueAmount) : sale.totalPrice - sale.paidAmount;

    await sale.save();
    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/batches/[id]/meat-sales/[saleId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id, saleId } = await params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(saleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Verify ownership: sale must belong to this batch
    const sale = await MeatSale.findOneAndDelete({ _id: saleId, batchId: id });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found in this batch" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
