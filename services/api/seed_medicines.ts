import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { getDb } from "./src/db/index";
import { medicines } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  const db = getDb();
  
  const meds = [
    { name: "Paracetamol 500mg", genericName: "Paracetamol", price: 15, stockQuantity: 100, prescriptionTier: "otc", category: "Pain Relief" },
    { name: "Amoxicillin 500mg", genericName: "Amoxicillin", price: 120, stockQuantity: 50, prescriptionTier: "schedule_h", category: "Antibiotics" },
    { name: "Cetirizine 10mg", genericName: "Cetirizine", price: 30, stockQuantity: 200, prescriptionTier: "otc", category: "Allergy" },
    { name: "Ibuprofen 400mg", genericName: "Ibuprofen", price: 40, stockQuantity: 150, prescriptionTier: "otc", category: "Pain Relief" },
    { name: "Omeprazole 20mg", genericName: "Omeprazole", price: 60, stockQuantity: 80, prescriptionTier: "schedule_h", category: "Gastrointestinal" },
  ];

  console.log("Seeding medicines...");
  for (const med of meds) {
    const existing = await db.select().from(medicines).where(eq(medicines.name, med.name)).limit(1);
    if (existing.length === 0) {
      await db.insert(medicines).values({ ...med, prescriptionTier: med.prescriptionTier as any });
      console.log(`Inserted ${med.name}`);
    } else {
      console.log(`Already exists: ${med.name}`);
    }
  }
  
  console.log("Done");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


