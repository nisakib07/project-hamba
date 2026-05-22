/**
 * Seed script to add 20 dummy customers to the "test 1" batch.
 * 
 * Usage: node scripts/seed-dummy-customers.mjs
 * 
 * Make sure the dev server is running at http://localhost:3000
 */

const BASE_URL = "http://localhost:3000";

// Bangla names for realistic dummy data
const dummyCustomers = [
  { name: "আব্দুল করিম", kg: 3.5, pricePerKg: 850, paid: 2975 },
  { name: "মোহাম্মদ রফিক", kg: 5, pricePerKg: 850, paid: 4250 },
  { name: "জাহিদ হাসান", kg: 2, pricePerKg: 850, paid: 0 },
  { name: "নুরুল ইসলাম", kg: 4, pricePerKg: 850, paid: 3400 },
  { name: "কামাল উদ্দিন", kg: 1.5, pricePerKg: 850, paid: 1275 },
  { name: "ফারুক আহমেদ", kg: 6, pricePerKg: 850, paid: 3000 },
  { name: "মোস্তফা কামাল", kg: 3, pricePerKg: 850, paid: 2550 },
  { name: "শাহিনুর রহমান", kg: 2.5, pricePerKg: 850, paid: 0 },
  { name: "আনোয়ার হোসেন", kg: 4.5, pricePerKg: 850, paid: 3825 },
  { name: "তৌফিক আলম", kg: 1, pricePerKg: 850, paid: 850 },
  { name: "রাশেদুল ইসলাম", kg: 3.5, pricePerKg: 850, paid: 1500 },
  { name: "মাসুদ রানা", kg: 2, pricePerKg: 850, paid: 1700 },
  { name: "শরীফুল ইসলাম", kg: 5.5, pricePerKg: 850, paid: 0 },
  { name: "আলমগীর কবির", kg: 3, pricePerKg: 850, paid: 2550 },
  { name: "হাসিবুর রহমান", kg: 4, pricePerKg: 850, paid: 2000 },
  { name: "জুবায়ের আহমেদ", kg: 2.5, pricePerKg: 850, paid: 2125 },
  { name: "সাইফুল ইসলাম", kg: 1.5, pricePerKg: 850, paid: 0 },
  { name: "বিল্লাল হোসেন", kg: 6.5, pricePerKg: 850, paid: 5525 },
  { name: "নাজমুল হক", kg: 3, pricePerKg: 850, paid: 1500 },
  { name: "ইমরান খান", kg: 4, pricePerKg: 850, paid: 3400 },
];

async function main() {
  console.log("🔍 Fetching batches to find 'test 1'...\n");

  // 1. Find the "test 1" batch
  const batchesRes = await fetch(`${BASE_URL}/api/batches`);
  const batchesJson = await batchesRes.json();

  if (!batchesJson.success) {
    console.error("❌ Failed to fetch batches:", batchesJson.error);
    process.exit(1);
  }

  const testBatch = batchesJson.data.find(
    (b) => b.batchName.toLowerCase().trim() === "test 1"
  );

  if (!testBatch) {
    console.error("❌ Batch 'test 1' not found. Available batches:");
    batchesJson.data.forEach((b) => console.log(`   - ${b.batchName} (${b._id})`));
    process.exit(1);
  }

  console.log(`✅ Found batch: "${testBatch.batchName}" (ID: ${testBatch._id})\n`);

  // 2. Add 20 dummy meat sales (each as a unique customer, no merging)
  let successCount = 0;
  let failCount = 0;

  for (const customer of dummyCustomers) {
    const payload = {
      customerName: customer.name,
      kgQuantity: customer.kg,
      pricePerKg: customer.pricePerKg,
      paidAmount: customer.paid,
      date: new Date().toISOString().split("T")[0],
      mergeIfExisting: false, // Don't merge — create individual entries
    };

    try {
      const res = await fetch(
        `${BASE_URL}/api/batches/${testBatch._id}/meat-sales`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();

      if (json.success) {
        successCount++;
        const total = customer.kg * customer.pricePerKg;
        const due = total - customer.paid;
        console.log(
          `  ✅ ${customer.name} — ${customer.kg}kg × ৳${customer.pricePerKg} = ৳${total} | Paid: ৳${customer.paid} | Due: ৳${due}`
        );
      } else {
        failCount++;
        console.log(`  ❌ ${customer.name} — ${json.error}`);
      }
    } catch (err) {
      failCount++;
      console.log(`  ❌ ${customer.name} — Network error: ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! ${successCount} customers added, ${failCount} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
