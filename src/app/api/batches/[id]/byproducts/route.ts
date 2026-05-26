import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch ID" },
        { status: 400 }
      );
    }

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch ID" },
        { status: 400 }
      );
    }

    const batch = await CowBatch.findById(id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Whitelist and validate fields
    const itemType = body.itemType;
    const quantity = Number(body.quantity) || 1;
    const price = Number(body.price);
    const buyerName = (body.buyerName || "").trim();
    const paidAmount = Number(body.paidAmount) || 0;
    const date = body.date || new Date();
    const mergeIfExisting = body.mergeIfExisting || false;

    if (!price || price <= 0 || isNaN(price)) {
      return NextResponse.json(
        { success: false, error: "Valid price is required" },
        { status: 400 }
      );
    }
    if (quantity <= 0 || isNaN(quantity)) {
      return NextResponse.json(
        { success: false, error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }
    if (paidAmount < 0) {
      return NextResponse.json(
        { success: false, error: "paidAmount cannot be negative" },
        { status: 400 }
      );
    }

    const currentTotal = quantity * price;
    const currentDueAmount = currentTotal - paidAmount;

    // Merge with existing sale if requested
    if (mergeIfExisting && buyerName) {
      const escapedName = buyerName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const existingSale = await ByproductSale.findOne({
        batchId: id,
        itemType: itemType,
        buyerName: { $regex: new RegExp("^" + escapedName + "$", "i") }
      });

      if (existingSale) {
        existingSale.quantity = (existingSale.quantity || 1) + quantity;
        existingSale.total += currentTotal;
        existingSale.paidAmount += paidAmount;

        // Weighted average price so pre-save hook calculates correct total
        if (existingSale.quantity > 0) {
          existingSale.price = existingSale.total / existingSale.quantity;
        }

        existingSale.dueAmount = existingSale.total - existingSale.paidAmount;
        await existingSale.save();
        return NextResponse.json({ success: true, data: existingSale }, { status: 200 });
      }
    }

    const saleData = {
      batchId: id,
      batchName: batch.batchName,
      itemType,
      quantity,
      price,
      total: currentTotal,
      buyerName,
      paidAmount,
      dueAmount: currentDueAmount,
      date,
    };

    const sale = await ByproductSale.create(saleData);
    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
