import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { medicines } from "../db/schema";
import { ilike, eq, and } from "drizzle-orm";

const router = Router();

// GET /medicines - Search and browse catalog
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, requiresPrescription } = req.query;

    let conditions = [eq(medicines.listingStatus, 'approved')];

    if (typeof search === "string" && search.trim() !== "") {
      conditions.push(ilike(medicines.name, `%${search.trim()}%`));
    }
    
    if (typeof category === "string" && category.trim() !== "") {
      conditions.push(eq(medicines.category, category.trim()));
    }

    if (requiresPrescription === "true") {
      conditions.push(eq(medicines.requiresPrescription, true));
    } else if (requiresPrescription === "false") {
      conditions.push(eq(medicines.requiresPrescription, false));
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

export default router;
