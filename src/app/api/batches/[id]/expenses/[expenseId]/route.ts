import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Expense from "@/models/Expense";

interface RouteParams {
  params: Promise<{ id: string; expenseId: string }>;
}

// PUT /api/batches/[id]/expenses/[expenseId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id, expenseId } = await params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Batch ID" },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Expense ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Whitelist and validate fields
    const { expenseType, amount, note, date } = body;
    
    if (expenseType && !["food", "butcher", "transport", "medicine", "other"].includes(expenseType)) {
      return NextResponse.json(
        { success: false, error: "Invalid expense type" },
        { status: 400 }
      );
    }
    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0.01) {
        return NextResponse.json(
          { success: false, error: "Amount must be at least 0.01" },
          { status: 400 }
        );
      }
    }

    // Find the expense belonging to the specific batch
    const expense = await Expense.findOne({ _id: expenseId, batchId: id });
    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found for this batch" },
        { status: 404 }
      );
    }

    // Apply updates
    if (expenseType !== undefined) expense.expenseType = expenseType;
    if (amount !== undefined) expense.amount = Number(amount);
    if (note !== undefined) expense.note = note;
    if (date !== undefined) expense.date = new Date(date);

    await expense.save();

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}

// DELETE /api/batches/[id]/expenses/[expenseId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id, expenseId } = await params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Batch ID" },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Expense ID" },
        { status: 400 }
      );
    }

    // Find and delete the expense belonging to the specific batch
    const expense = await Expense.findOneAndDelete({ _id: expenseId, batchId: id });
    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found for this batch" },
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
