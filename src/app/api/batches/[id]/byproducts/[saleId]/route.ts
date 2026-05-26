import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ByproductSale from "@/models/ByproductSale";

interface RouteParams {
  params: Promise<{ id: string; saleId: string }>;
}

// PUT /api/batches/[id]/byproducts/[saleId]
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
    const sale = await ByproductSale.findOne({ _id: saleId, batchId: id });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Byproduct sale not found in this batch" },
        { status: 404 }
      );
    }

    // Apply whitelisted updates
    if (body.quantity !== undefined) sale.quantity = Number(body.quantity);
    if (body.price !== undefined) sale.price = Number(body.price);
    if (body.paidAmount !== undefined) sale.paidAmount = Number(body.paidAmount);
    if (body.buyerName !== undefined) sale.buyerName = body.buyerName;
    if (body.itemType !== undefined) sale.itemType = body.itemType;
    if (body.date !== undefined) sale.date = body.date;

    // Recalculate derived fields
    sale.total = body.total !== undefined ? Number(body.total) : sale.quantity * sale.price;
    sale.dueAmount = body.dueAmount !== undefined ? Number(body.dueAmount) : sale.total - sale.paidAmount;

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

// DELETE /api/batches/[id]/byproducts/[saleId]
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
    const sale = await ByproductSale.findOneAndDelete({ _id: saleId, batchId: id });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Byproduct sale not found in this batch" },
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
