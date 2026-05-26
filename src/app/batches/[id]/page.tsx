import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";
import MeatSale from "@/models/MeatSale";
import ByproductSale from "@/models/ByproductSale";
import Expense from "@/models/Expense";
import { calculateProfit } from "@/lib/profitCalculator";
import { getCustomerNames } from "@/lib/dashboardData";
import BatchDetailClient from "@/components/BatchDetailClient";
import mongoose from "mongoose";
import { notFound } from "next/navigation";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: "ব্যাচ পাওয়া যায়নি | গরু ব্যবসা" };
  }
  await dbConnect();
  const batch = await CowBatch.findById(id).select("batchName").lean();
  if (!batch) {
    return { title: "ব্যাচ পাওয়া যায়নি | গরু ব্যবসা" };
  }
  return { title: `${batch.batchName} | গরু ব্যবসা` };
}

async function getBatchData(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await dbConnect();

  const batch = await CowBatch.findById(id).lean();
  if (!batch) return null;

  const [meatSales, byproductSales, expenses, customerNames] = await Promise.all([
    MeatSale.find({ batchId: id }).sort({ date: -1 }).lean(),
    ByproductSale.find({ batchId: id }).sort({ date: -1 }).lean(),
    Expense.find({ batchId: id }).sort({ date: -1 }).lean(),
    getCustomerNames(),
  ]);

  const profitData = calculateProfit(batch as any, meatSales as any[], byproductSales as any[], expenses as any[]);

  // Serialize for client component (convert ObjectIds and Dates to strings)
  const serialize = (obj: any) => JSON.parse(JSON.stringify(obj));

  return {
    batch: serialize(batch),
    meatSales: serialize(meatSales),
    byproductSales: serialize(byproductSales),
    expenses: serialize(expenses),
    profitData,
    customerNames,
  };
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getBatchData(id);

  if (!data) {
    notFound();
  }

  return (
    <BatchDetailClient
      id={id}
      initialBatch={data.batch}
      initialMeatSales={data.meatSales}
      initialByproductSales={data.byproductSales}
      initialExpenses={data.expenses}
      initialProfitData={data.profitData}
      initialCustomerNames={data.customerNames}
    />
  );
}
