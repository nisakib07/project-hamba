import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboardData";

// GET /api/dashboard — Aggregated dashboard stats
export async function GET() {
  try {
    const data = await getDashboardData();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
