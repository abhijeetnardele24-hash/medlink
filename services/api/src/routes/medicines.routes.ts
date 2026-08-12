import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { medicines } from "../db/schema";
import { ilike, eq, and } from "drizzle-orm";

const router = Router();

// GET /medicines - Search and browse catalog
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, prescriptionTier, pharmacistId } = req.query;

    let conditions = [eq(medicines.listingStatus, 'approved')];
    
    if (typeof pharmacistId === "string" && pharmacistId.trim() !== "") {
      conditions.push(eq(medicines.pharmacistId, pharmacistId.trim()));
    }

    if (typeof search === "string" && search.trim() !== "") {
      conditions.push(ilike(medicines.name, `%${search.trim()}%`));
    }
    
    if (typeof category === "string" && category.trim() !== "") {
      conditions.push(eq(medicines.category, category.trim()));
    }

    if (prescriptionTier && typeof prescriptionTier === "string") {
      conditions.push(eq(medicines.prescriptionTier, prescriptionTier as "otc" | "schedule_h" | "restricted"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await getDb()
      .select()
      .from(medicines)
      .where(whereClause)
      .orderBy(medicines.name);

    res.json({ medicines: results });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// GET /medicines/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const results = await getDb()
      .select()
      .from(medicines)
      .where(eq(medicines.id, id))
      .limit(1);

    if (results.length === 0) {
      res.status(404).json({ error: "Medicine not found" });
      return;
    }

    res.json({ medicine: results[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

import { authenticate } from "../middleware/auth";
import { users, pharmacists } from "../db/schema";

// POST /medicines - Add new medicine to inventory
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    
    // Find pharmacist by user uid
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      res.status(403).json({ error: "Only pharmacists can add medicines" });
      return;
    }

    const pharmacistId = pharmacistRows[0].id;
    
    const {
      name,
      genericName,
      description,
      imageUrl,
      composition,
      dosageForm,
      manufacturer,
      price,
      stockQuantity,
      prescriptionTier,
      category
    } = req.body;

    if (!name || price === undefined) {
      res.status(400).json({ error: "Name and price are required" });
      return;
    }

    const [newMedicine] = await getDb().insert(medicines).values({
      pharmacistId,
      name,
      genericName,
      description,
      imageUrl,
      composition,
      dosageForm,
      manufacturer,
      price: Number(price),
      stockQuantity: Number(stockQuantity || 0),
      prescriptionTier: prescriptionTier || "otc",
      category
    }).returning();

    res.status(201).json({ medicine: newMedicine });
  } catch (error) {
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

export default router;
