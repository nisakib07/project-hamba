import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://hamba_data:hamba_data@hambacluster.pcwttsf.mongodb.net/cow-batch-manager?retryWrites=true&w=majority&appName=HambaCluster";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  const db = mongoose.connection.db;
  const batches = await db.collection("cowbatches").find({}).toArray();
  console.log("Batches count:", batches.length);
  console.log("Batches:");
  console.log(JSON.stringify(batches, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
