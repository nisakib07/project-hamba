import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";

// GET /api/customers — Get all unique customer/buyer names across all batches
export async function GET() {
  try {
    await dbConnect();

    const [meatNames, bypNames] = await Promise.all([
      MeatSale.distinct("customerName"),
      ByproductSale.distinct("buyerName"),
    ]);

    // Combine, deduplicate, filter empty, sort
    const allNames = [...new Set([...meatNames, ...bypNames])]
      .filter((n) => n && n.trim())
      .sort((a, b) => a.localeCompare(b, "bn"));

    return NextResponse.json({ success: true, data: allNames });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
