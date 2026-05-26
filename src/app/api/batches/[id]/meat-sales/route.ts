import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch ID" },
        { status: 400 }
      );
    }

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch ID" },
        { status: 400 }
      );
    }

    // Verify batch exists
    const batch = await CowBatch.findById(id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Whitelist and validate fields
    const customerName = (body.customerName || "").trim();
    const kgQuantity = Number(body.kgQuantity);
    const pricePerKg = Number(body.pricePerKg) || batch.baseMeatPricePerKg;
    const paidAmount = Number(body.paidAmount) || 0;
    const date = body.date || new Date();
    const mergeIfExisting = body.mergeIfExisting || false;

    if (!kgQuantity || kgQuantity <= 0 || isNaN(kgQuantity)) {
      return NextResponse.json(
        { success: false, error: "Valid kgQuantity is required" },
        { status: 400 }
      );
    }
    if (!pricePerKg || pricePerKg <= 0 || isNaN(pricePerKg)) {
      return NextResponse.json(
        { success: false, error: "Valid pricePerKg is required" },
        { status: 400 }
      );
    }
    if (paidAmount < 0) {
      return NextResponse.json(
        { success: false, error: "paidAmount cannot be negative" },
        { status: 400 }
      );
    }

    // Calculate derived fields
    const currentTotalPrice = kgQuantity * pricePerKg;
    const currentDueAmount = currentTotalPrice - paidAmount;

    // Merge with existing sale if requested
    if (mergeIfExisting && customerName) {
      const escapedName = customerName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const existingSale = await MeatSale.findOne({
        batchId: id,
        customerName: { $regex: new RegExp("^" + escapedName + "$", "i") }
      });

      if (existingSale) {
        existingSale.kgQuantity += kgQuantity;
        existingSale.totalPrice += currentTotalPrice;
        existingSale.paidAmount += paidAmount;

        // Weighted average price so pre-save hook calculates correct total
        if (existingSale.kgQuantity > 0) {
          existingSale.pricePerKg = existingSale.totalPrice / existingSale.kgQuantity;
        }

        existingSale.dueAmount = existingSale.totalPrice - existingSale.paidAmount;
        await existingSale.save();
        return NextResponse.json({ success: true, data: existingSale }, { status: 200 });
      }
    }

    const saleData = {
      batchId: id,
      batchName: batch.batchName,
      customerName,
      kgQuantity,
      pricePerKg,
      paidAmount,
      totalPrice: currentTotalPrice,
      dueAmount: currentDueAmount,
      date,
    };

    const sale = await MeatSale.create(saleData);
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
