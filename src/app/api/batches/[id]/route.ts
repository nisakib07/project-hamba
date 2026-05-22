import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import Expense from "@/models/Expense";
import { calculateProfit } from "@/lib/profitCalculator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/batches/[id] — Get single batch with profit calculation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const batch = await CowBatch.findById(id).lean();
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const [meatSales, byproductSales, expenses] = await Promise.all([
      MeatSale.find({ batchId: id }).sort({ date: -1 }).lean(),
      ByproductSale.find({ batchId: id }).sort({ date: -1 }).lean(),
      Expense.find({ batchId: id }).sort({ date: -1 }).lean(),
    ]);

    const profitData = calculateProfit(batch, meatSales, byproductSales, expenses);

    return NextResponse.json({
      success: true,
      data: {
        batch,
        meatSales,
        byproductSales,
        expenses,
        profitData,
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

// PUT /api/batches/[id] — Update batch
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const batch = await CowBatch.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/batches/[id] — Delete batch and cascade
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;
    const batch = await CowBatch.findByIdAndDelete(id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Cascade delete all related records
    await Promise.all([
      MeatSale.deleteMany({ batchId: id }),
      ByproductSale.deleteMany({ batchId: id }),
      Expense.deleteMany({ batchId: id }),
    ]);

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
