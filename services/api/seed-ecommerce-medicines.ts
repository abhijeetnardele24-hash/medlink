import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { medicines } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Parse .env manually
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

const ecomDataset = [
  // Pain & Fever
  { name: 'Advil Liqui-Gels', genericName: 'Ibuprofen (200mg)', category: 'Pain Relief', price: 15, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', description: 'Fast acting pain relief for headaches, muscle aches, and fever reduction.', manufacturer: 'Pfizer', dosageForm: 'Capsule', composition: 'Ibuprofen 200mg', stockQuantity: 250 },
  { name: 'Tylenol Extra Strength', genericName: 'Acetaminophen (500mg)', category: 'Pain Relief', price: 12, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1550572017-edb79998816c?w=500&q=80', description: 'Relieves minor aches and pains and reduces fever.', manufacturer: 'Johnson & Johnson', dosageForm: 'Caplet', composition: 'Acetaminophen 500mg', stockQuantity: 400 },
  { name: 'Aleve Back & Muscle Pain', genericName: 'Naproxen Sodium (220mg)', category: 'Pain Relief', price: 18, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&q=80', description: 'Targeted pain relief lasting up to 12 hours.', manufacturer: 'Bayer', dosageForm: 'Tablet', composition: 'Naproxen Sodium 220mg', stockQuantity: 150 },

  // Allergy
  { name: 'Zyrtec 24 Hour Allergy', genericName: 'Cetirizine HCl (10mg)', category: 'Allergy', price: 25, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&q=80', description: 'Relief from sneezing, runny nose, itchy, watery eyes, and itchy nose or throat.', manufacturer: 'Johnson & Johnson', dosageForm: 'Tablet', composition: 'Cetirizine Hydrochloride 10mg', stockQuantity: 300 },
  { name: 'Claritin Non-Drowsy', genericName: 'Loratadine (10mg)', category: 'Allergy', price: 22, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80', description: 'Powerful, 24-hour, non-drowsy indoor and outdoor allergy relief.', manufacturer: 'Bayer', dosageForm: 'Tablet', composition: 'Loratadine 10mg', stockQuantity: 280 },
  { name: 'Flonase Allergy Relief', genericName: 'Fluticasone Propionate (50mcg)', category: 'Allergy', price: 35, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', description: '24-hour relief from nasal congestion, sneezing, and runny nose.', manufacturer: 'GSK', dosageForm: 'Nasal Spray', composition: 'Fluticasone Propionate 50mcg', stockQuantity: 120 },
  { name: 'Symbicort Inhaler', genericName: 'Budesonide (160mcg) / Formoterol (4.5mcg)', category: 'Asthma', price: 150, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&q=80', description: 'Prescription maintenance treatment for asthma and COPD.', manufacturer: 'AstraZeneca', dosageForm: 'Inhaler', composition: 'Budesonide / Formoterol', stockQuantity: 80 },

  // Stomach Care
  { name: 'Nexium 24HR', genericName: 'Esomeprazole Magnesium (20mg)', category: 'Stomach Care', price: 28, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', description: 'Frequent heartburn protection and acid reducer.', manufacturer: 'Haleon', dosageForm: 'Capsule', composition: 'Esomeprazole 20mg', stockQuantity: 200 },
  { name: 'Pepto Bismol Liquid', genericName: 'Bismuth Subsalicylate (525mg/15mL)', category: 'Stomach Care', price: 10, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80', description: 'Relief from nausea, heartburn, indigestion, upset stomach, and diarrhea.', manufacturer: 'Procter & Gamble', dosageForm: 'Liquid', composition: 'Bismuth Subsalicylate', stockQuantity: 350 },
  { name: 'Imodium A-D', genericName: 'Loperamide HCl (2mg)', category: 'Stomach Care', price: 14, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1550572017-edb79998816c?w=500&q=80', description: 'Controls the symptoms of diarrhea effectively.', manufacturer: 'Johnson & Johnson', dosageForm: 'Caplet', composition: 'Loperamide 2mg', stockQuantity: 190 },

  // Supplements
  { name: 'Centrum Adults Multivitamin', genericName: 'Multivitamin / Multimineral', category: 'Supplements', price: 20, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&q=80', description: 'Daily multivitamin supplement for adults with essential nutrients.', manufacturer: 'Haleon', dosageForm: 'Tablet', composition: 'A, B, C, D3, E, Calcium, Zinc', stockQuantity: 500 },
  { name: 'Nature Made Fish Oil', genericName: 'Omega-3 (1200mg)', category: 'Supplements', price: 18, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&q=80', description: 'Supports heart health, brain health, and joint mobility.', manufacturer: 'Pharmavite', dosageForm: 'Softgel', composition: 'Omega-3 Fatty Acids 1200mg', stockQuantity: 450 },
  { name: 'Emergen-C Vitamin C', genericName: 'Vitamin C (1000mg)', category: 'Supplements', price: 16, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', description: 'Daily immune support with Vitamin C, B Vitamins, and Electrolytes.', manufacturer: 'Haleon', dosageForm: 'Powder', composition: 'Vitamin C 1000mg', stockQuantity: 600 },

  // Cough & Cold
  { name: 'DayQuil Severe', genericName: 'Acetaminophen / Dextromethorphan / Guaifenesin / Phenylephrine', category: 'Cough & Cold', price: 17, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', description: 'Non-drowsy, multi-symptom cold and flu relief.', manufacturer: 'Procter & Gamble', dosageForm: 'Liquid/Caplet', composition: 'Acetaminophen 325mg + Multiple', stockQuantity: 300 },
  { name: 'Mucinex DM', genericName: 'Guaifenesin (600mg) / Dextromethorphan (30mg)', category: 'Cough & Cold', price: 24, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&q=80', description: 'Controls cough and thins and loosens mucus.', manufacturer: 'Reckitt Benckiser', dosageForm: 'Extended-Release Tablet', composition: 'Guaifenesin + Dextromethorphan', stockQuantity: 250 },
  { name: 'Robitussin Adult Maximum Strength', genericName: 'Dextromethorphan (20mg) / Guaifenesin (400mg)', category: 'Cough & Cold', price: 13, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80', description: 'Relieves cough and chest congestion.', manufacturer: 'Haleon', dosageForm: 'Syrup', composition: 'Dextromethorphan + Guaifenesin', stockQuantity: 180 },

  // Prescription / Specialized (Examples for tagging)
  { name: 'Lipitor', genericName: 'Atorvastatin (40mg)', category: 'Heart Care', price: 85, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1550572017-edb79998816c?w=500&q=80', description: 'Used to treat high cholesterol and lower the risk of stroke or heart attack.', manufacturer: 'Pfizer', dosageForm: 'Tablet', composition: 'Atorvastatin Calcium 40mg', stockQuantity: 400 },
  { name: 'Lisinopril', genericName: 'Lisinopril (20mg)', category: 'Heart Care', price: 40, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&q=80', description: 'ACE inhibitor used to treat high blood pressure (hypertension) and heart failure.', manufacturer: 'Generic', dosageForm: 'Tablet', composition: 'Lisinopril 20mg', stockQuantity: 550 },
  { name: 'Amoxil', genericName: 'Amoxicillin (500mg)', category: 'Antibiotics', price: 25, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=500&q=80', description: 'Penicillin antibiotic used to treat various bacterial infections.', manufacturer: 'GSK', dosageForm: 'Capsule', composition: 'Amoxicillin 500mg', stockQuantity: 800 },
  { name: 'Glucophage', genericName: 'Metformin HCl (500mg)', category: 'Diabetes', price: 30, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80', description: 'Improves blood sugar control in people with type 2 diabetes.', manufacturer: 'Bristol-Myers Squibb', dosageForm: 'Tablet', composition: 'Metformin Hydrochloride 500mg', stockQuantity: 650 },
  { name: 'Synthroid', genericName: 'Levothyroxine (100mcg)', category: 'Thyroid Care', price: 45, prescriptionTier: 'schedule_h', imageUrl: 'https://images.unsplash.com/photo-1550572017-edb79998816c?w=500&q=80', description: 'Replaces or provides more thyroid hormone, treating hypothyroidism.', manufacturer: 'AbbVie', dosageForm: 'Tablet', composition: 'Levothyroxine Sodium 100mcg', stockQuantity: 700 },

  // First Aid (OTC)
  { name: 'Neosporin Original', genericName: 'Bacitracin / Neomycin / Polymyxin B', category: 'First Aid', price: 9, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', description: 'First aid antibiotic ointment to prevent infection in minor cuts, scrapes, and burns.', manufacturer: 'Johnson & Johnson', dosageForm: 'Ointment', composition: 'Bacitracin + Neomycin + Polymyxin B', stockQuantity: 300 },
  { name: 'Hydrocortisone 1% Cream', genericName: 'Hydrocortisone (1%)', category: 'First Aid', price: 7, prescriptionTier: 'otc', imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&q=80', description: 'Relieves itching associated with minor skin irritations, inflammation, and rashes.', manufacturer: 'Generic', dosageForm: 'Cream', composition: 'Hydrocortisone 1%', stockQuantity: 420 },
];

async function main() {
  console.log("Seeding realistic E-Commerce Medicine dataset...");
  let insertedCount = 0;
  for (const item of ecomDataset) {
    try {
      const existing = await db.select().from(medicines).where(eq(medicines.name, item.name)).limit(1);
      
      if (existing.length > 0) {
        await db.update(medicines).set(item).where(eq(medicines.id, existing[0].id));
        console.log(`Updated: ${item.name}`);
      } else {
        await db.insert(medicines).values({ ...item, prescriptionTier: item.prescriptionTier as any });
        console.log(`Inserted: ${item.name}`);
      }
      insertedCount++;
    } catch (error) {
      console.error(`Error processing ${item.name}:`, error);
    }
  }

  console.log(`\nSuccessfully processed ${insertedCount} e-commerce medicines.`);
  console.log("🎉 Dataset Seeding Complete!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
