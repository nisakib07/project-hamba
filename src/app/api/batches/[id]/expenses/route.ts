import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";
import CowBatch from "@/models/CowBatch";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/batches/[id]/expenses
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

    const expenses = await Expense.find({ batchId: id }).sort({ date: -1 });
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/batches/[id]/expenses
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

    // Whitelist fields
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const expenseData = {
      batchId: id,
      expenseType: body.expenseType || "other",
      amount,
      note: body.note || "",
      date: body.date || new Date(),
    };

    const expense = await Expense.create(expenseData);
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
