import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";

// GET /api/batches — List all batches
export async function GET() {
  try {
    await dbConnect();
    const batches = await CowBatch.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/batches — Create new batch
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      batchName,
      purchaseDate,
      buyingCost,
      foodCost,
      butcherCost,
      transportCost,
      otherExpenses,
      baseMeatPricePerKg,
      totalMeatKg,
      chamraPrice,
      vuriPrice,
      paPrice,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!batchName || typeof batchName !== "string" || !batchName.trim()) {
      return NextResponse.json(
        { success: false, error: "Batch name is required" },
        { status: 400 }
      );
    }
    if (!purchaseDate) {
      return NextResponse.json(
        { success: false, error: "Purchase date is required" },
        { status: 400 }
      );
    }
    if (buyingCost === undefined || isNaN(Number(buyingCost)) || Number(buyingCost) < 0) {
      return NextResponse.json(
        { success: false, error: "Buying cost must be a non-negative number" },
        { status: 400 }
      );
    }
    if (baseMeatPricePerKg === undefined || isNaN(Number(baseMeatPricePerKg)) || Number(baseMeatPricePerKg) < 0) {
      return NextResponse.json(
        { success: false, error: "Base meat price per kg must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate other optional numeric fields
    const numericFields = {
      foodCost,
      butcherCost,
      transportCost,
      otherExpenses,
      totalMeatKg,
      chamraPrice,
      vuriPrice,
      paPrice,
    };
    for (const [key, val] of Object.entries(numericFields)) {
      if (val !== undefined && (isNaN(Number(val)) || Number(val) < 0)) {
        return NextResponse.json(
          { success: false, error: `${key} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    if (status && !["active", "completed"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const cleanedData = {
      batchName: batchName.trim(),
      purchaseDate: new Date(purchaseDate),
      buyingCost: Number(buyingCost),
      foodCost: foodCost !== undefined ? Number(foodCost) : 0,
      butcherCost: butcherCost !== undefined ? Number(butcherCost) : 0,
      transportCost: transportCost !== undefined ? Number(transportCost) : 0,
      otherExpenses: otherExpenses !== undefined ? Number(otherExpenses) : 0,
      baseMeatPricePerKg: Number(baseMeatPricePerKg),
      totalMeatKg: totalMeatKg !== undefined ? Number(totalMeatKg) : 0,
      chamraPrice: chamraPrice !== undefined ? Number(chamraPrice) : 0,
      vuriPrice: vuriPrice !== undefined ? Number(vuriPrice) : 0,
      paPrice: paPrice !== undefined ? Number(paPrice) : 0,
      status: status || "active",
      notes: notes !== undefined ? String(notes) : "",
    };

    const batch = await CowBatch.create(cleanedData);
    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
