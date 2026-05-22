import BatchListClient from "@/components/BatchListClient";
import dbConnect from "@/lib/mongodb";
import CowBatch from "@/models/CowBatch";

export const dynamic = "force-dynamic";

interface BatchItem {
  _id: string;
  batchName: string;
  purchaseDate: string;
  buyingCost: number;
  status: string;
  baseMeatPricePerKg: number;
  totalMeatKg: number;
  createdAt: string;
}

async function getAllBatches(): Promise<BatchItem[]> {
  await dbConnect();
  const batches = await CowBatch.find({}).sort({ createdAt: -1 }).lean();

  return batches.map((batch: any) => ({
    ...batch,
    _id: batch._id.toString(),
    purchaseDate: batch.purchaseDate instanceof Date ? batch.purchaseDate.toISOString() : batch.purchaseDate,
    createdAt: batch.createdAt instanceof Date ? batch.createdAt.toISOString() : batch.createdAt,
  }));
}

export default async function BatchListPage() {
  const initialBatches = await getAllBatches();
  return <BatchListClient initialBatches={initialBatches} />;
}
