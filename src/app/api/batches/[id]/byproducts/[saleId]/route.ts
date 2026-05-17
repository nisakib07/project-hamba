import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ByproductSale from "@/models/ByproductSale";

interface RouteParams {
  params: Promise<{ id: string; saleId: string }>;
}

// PUT /api/batches/[id]/byproducts/[saleId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { saleId } = await params;
    const body = await request.json();

    if (body.quantity && body.price) {
      body.total = body.quantity * body.price;
    }
    if (body.total !== undefined && body.paidAmount !== undefined) {
      body.dueAmount = body.total - body.paidAmount;
    }

    const sale = await ByproductSale.findByIdAndUpdate(saleId, body, {
      new: true,
      runValidators: true,
    });
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Byproduct sale not found" },
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

// DELETE /api/batches/[id]/byproducts/[saleId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { saleId } = await params;
    const sale = await ByproductSale.findByIdAndDelete(saleId);
    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Byproduct sale not found" },
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
