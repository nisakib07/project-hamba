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
    const batch = await CowBatch.create(body);
    return NextResponse.json({ success: true, data: batch }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
