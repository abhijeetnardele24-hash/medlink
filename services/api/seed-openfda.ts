import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { medicines } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Manually parse .env because process.env is flaky in some Windows shells
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

// A fallback pill image so the UI doesn't look empty
const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';

async function main() {
  console.log("Fetching drug data from OpenFDA...");
  
  // Fetch 100 finished products
  const response = await fetch('https://api.fda.gov/drug/ndc.json?search=finished:true&limit=100');
  const data = await response.json();
  
  if (!data.results || data.results.length === 0) {
    console.error("No data found from OpenFDA.");
    process.exit(1);
  }

  let insertedCount = 0;
  
  for (const item of data.results) {
    try {
      const name = item.brand_name || item.generic_name;
      if (!name) continue; // Skip if no name

      // Parse active ingredients
      let composition = item.generic_name || "Unknown";
      if (item.active_ingredients && item.active_ingredients.length > 0) {
        composition = item.active_ingredients.map((ai: any) => `${ai.name} ${ai.strength}`).join(' + ');
      }

      // Determine category
      let category = "General Medicine";
      if (item.pharm_class && item.pharm_class.length > 0) {
        // Just take the first pharmacological class, strip the [EPC] tag if present
        category = item.pharm_class[0].replace(/\[.*?\]/g, '').trim();
      }

      const manufacturer = item.openfda?.manufacturer_name?.[0] || "Unknown Manufacturer";
      const requiresPrescription = item.product_type?.includes('PRESCRIPTION') || false;
      const description = `FDA Approved Drug. NDC: ${item.product_ndc || 'N/A'}. Route: ${item.route ? item.route.join(', ') : 'Oral'}.`;

      const med = {
        name: name.slice(0, 255), // Max 255 chars
        genericName: (item.generic_name || name).slice(0, 255),
        description: description,
        imageUrl: FALLBACK_IMAGE_URL,
        composition: composition,
        dosageForm: item.dosage_form || "Tablet",
        manufacturer: manufacturer,
        price: Math.floor(Math.random() * 400) + 20, // Random price between 20 and 420
        stockQuantity: Math.floor(Math.random() * 500) + 50, // Random stock 50-550
        requiresPrescription: requiresPrescription,
        category: category.slice(0, 100), // Max length safety
      };

      // Check if medicine already exists
      const existing = await db.select().from(medicines).where(eq(medicines.name, med.name)).limit(1);
      
      if (existing.length > 0) {
        // Update existing
        await db.update(medicines).set(med).where(eq(medicines.id, existing[0].id));
        console.log(`Updated: ${med.name}`);
      } else {
        // Insert new
        await db.insert(medicines).values(med);
        console.log(`Inserted: ${med.name}`);
      }
      insertedCount++;
    } catch (error) {
      console.error(`Error processing ${item.brand_name}:`, error);
    }
  }

  console.log(`\nSuccessfully processed ${insertedCount} medicines from OpenFDA.`);
  console.log("🎉 FDA Dataset Seeding Complete!");
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
