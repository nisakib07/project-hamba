import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ByproductSale from "@/models/ByproductSale";
import CowBatch from "@/models/CowBatch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/batches/[id]/byproducts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const sales = await ByproductSale.find({ batchId: id }).sort({ date: -1 });
    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/batches/[id]/byproducts
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    const batch = await CowBatch.findById(id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    body.batchId = id;
    const currentTotal = (body.quantity || 1) * body.price;
    const currentPaidAmount = body.paidAmount || 0;
    const currentDueAmount = currentTotal - currentPaidAmount;

    if (body.mergeIfExisting && body.buyerName) {
      const existingSale = await ByproductSale.findOne({ batchId: id, buyerName: body.buyerName, itemType: body.itemType });
      if (existingSale) {
        existingSale.quantity = (existingSale.quantity || 1) + (body.quantity || 1);
        existingSale.total += currentTotal;
        existingSale.paidAmount += currentPaidAmount;
        existingSale.dueAmount = existingSale.total - existingSale.paidAmount;
        await existingSale.save();
        return NextResponse.json({ success: true, data: existingSale }, { status: 200 });
      }
    }

    body.total = currentTotal;
    body.dueAmount = currentDueAmount;

    const sale = await ByproductSale.create(body);
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
