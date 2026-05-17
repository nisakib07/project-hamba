import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";

interface RouteParams {
  params: Promise<{ id: string; saleId: string }>;
}

// PUT /api/batches/[id]/meat-sales/[saleId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { saleId } = await params;
    const body = await request.json();

    // Recalculate derived fields
    if (body.kgQuantity && body.pricePerKg) {
      body.totalPrice = body.kgQuantity * body.pricePerKg;
    }
    if (body.totalPrice !== undefined && body.paidAmount !== undefined) {
      body.dueAmount = body.totalPrice - body.paidAmount;
    }

    const sale = await MeatSale.findByIdAndUpdate(saleId, body, {
      new: true,
      runValidators: true,
    });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }
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
    const { saleId } = await params;
    const sale = await MeatSale.findByIdAndDelete(saleId);
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
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
