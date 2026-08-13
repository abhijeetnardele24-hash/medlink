import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { getDb } from "../db";
import { medicines, pharmacists, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyDatabaseConnection, closeDatabasePool } from "../postgres";

const OPENFDA_URL = "https://api.fda.gov/drug/ndc.json?limit=50";

async function main() {
  console.log("Starting OpenFDA seeding process...");
  try {
    await verifyDatabaseConnection();
    const db = getDb();

    // Ensure we have a default pharmacist to assign these medicines to
    let [pharmacist] = await db.select().from(pharmacists).limit(1);
    if (!pharmacist) {
      console.log("No pharmacist found. Creating a default one...");
      // Create a dummy user first
      const [user] = await db.insert(users).values({
        firebaseUid: "system-pharmacist-seed",
        email: "pharma@medlink.com",
        role: "pharmacist",
        displayName: "System Pharmacist",
      }).returning();
      
      [pharmacist] = await db.insert(pharmacists).values({
        userId: user.id,
        fullName: "System Pharmacist",
        shopName: "MedLink Default Pharmacy",
        registeredAddress: "123 Health St",
        verificationStatus: "verified",
      }).returning();
    }

    console.log(`Fetching drug data from OpenFDA...`);
    const res = await fetch(OPENFDA_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch OpenFDA data: ${res.statusText}`);
    }
    
    const data = await res.json();
    const results = data.results || [];
    
    if (results.length === 0) {
      console.log("No results found in OpenFDA response.");
      return;
    }

    console.log(`Found ${results.length} drugs. Seeding database...`);
    
    let count = 0;
    for (const item of results) {
      const name = item.brand_name || item.generic_name;
      if (!name) continue;

      const genericName = item.generic_name || name;
      const manufacturer = item.labeler_name || "Unknown";
      const dosageForm = item.dosage_form || "TABLET";
      
      // Randomize some fields for realistic demo data
      const price = Math.floor(Math.random() * 500) + 10;
      const stock = Math.floor(Math.random() * 1000) + 50;
      const tier = Math.random() > 0.8 ? "schedule_h" : "otc";

      await db.insert(medicines).values({
        pharmacistId: pharmacist.id,
        name: name.substring(0, 255),
        genericName: genericName.substring(0, 255),
        manufacturer: manufacturer.substring(0, 255),
        dosageForm: dosageForm.substring(0, 255),
        price: price,
        stockQuantity: stock,
        prescriptionTier: tier as "otc" | "schedule_h",
        category: item.product_type || "HUMAN PRESCRIPTION DRUG",
        listingStatus: "approved",
      }).onConflictDoNothing(); // If it exists, skip
      count++;
    }

    console.log(`Successfully seeded ${count} medicines from OpenFDA!`);

  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await closeDatabasePool();
    process.exit(0);
  }
}

main();
