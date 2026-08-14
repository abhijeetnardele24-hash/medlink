import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { medicines, pharmacists, users } from "../db/schema";
import { ilike, eq, and, sql } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { addMedicineSchema } from "../schemas/medicines.schema";
import { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } from "../errors";

import { withCache, invalidateCachePrefix } from "../redis";

const router = Router();

// GET /medicines - Search and browse catalog
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, prescriptionTier, pharmacistId } = req.query;

    const cacheKey = `medicines:list:${search || ""}:${category || ""}:${prescriptionTier || ""}:${pharmacistId || ""}`;

    const data = await withCache(cacheKey, 300, async () => {
      let conditions: any[] = [];

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

      // Join with pharmacists to get seller info
      const results = await getDb()
        .select({
          id: medicines.id,
          name: medicines.name,
          genericName: medicines.genericName,
          description: medicines.description,
          imageUrl: medicines.imageUrl,
          composition: medicines.composition,
          dosageForm: medicines.dosageForm,
          manufacturer: medicines.manufacturer,
          price: medicines.price,
          stockQuantity: medicines.stockQuantity,
          prescriptionTier: medicines.prescriptionTier,
          category: medicines.category,
          listingStatus: medicines.listingStatus,
          pharmacistId: medicines.pharmacistId,
          // Seller info joined from pharmacists
          sellerShopName: pharmacists.shopName,
          sellerFullName: pharmacists.fullName,
          sellerAddress: pharmacists.registeredAddress,
        })
        .from(medicines)
        .leftJoin(pharmacists, eq(pharmacists.id, medicines.pharmacistId))
        .where(whereClause)
        .orderBy(medicines.name);

      // Map to add a display sellerName
      const mapped = results.map(m => ({
        ...m,
        sellerName: m.sellerShopName || "MedLink Marketplace",
      }));

      return { medicines: mapped };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});


// GET /medicines/:id
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const data = await withCache(`medicines:profile:${id}`, 300, async () => {
      const results = await getDb()
        .select()
        .from(medicines)
        .where(eq(medicines.id, id))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return { medicine: results[0] };
    });

    if (!data) {
      throw new NotFoundError("Medicine not found");
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch medicine" });
  }
});

// POST /medicines - Add new medicine to inventory
router.post("/", authenticate, validateBody(addMedicineSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    
    // Find pharmacist by user uid
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      throw new ForbiddenError("Only pharmacists can add medicines");
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
      throw new ValidationError("Name and price are required");
    }

    
    let enhancedDescription = description || "";
    let enhancedComposition = composition || "";
    
    // Attempt OpenFDA live lookup
    if (process.env.OPENFDA_API_KEY && name) {
      try {
        const query = encodeURIComponent(`openfda.brand_name:"${name}" OR openfda.generic_name:"${name}"`);
        const fdaUrl = `https://api.fda.gov/drug/label.json?api_key=${process.env.OPENFDA_API_KEY}&search=${query}&limit=1`;
        const fdaRes = await fetch(fdaUrl);
        if (fdaRes.ok) {
          const fdaData = await fdaRes.json();
          if (fdaData.results && fdaData.results.length > 0) {
            const fdaResult = fdaData.results[0];
            
            // Append FDA Boxed Warning or Warnings
            const warnings = fdaResult.boxed_warning || fdaResult.warnings;
            if (warnings && warnings.length > 0) {
              enhancedDescription = enhancedDescription 
                ? `${enhancedDescription}\n\nFDA Warnings: ${warnings[0]}`
                : `FDA Warnings: ${warnings[0]}`;
            }
            
            // Append Active Ingredient if not provided
            const activeIngredient = fdaResult.active_ingredient;
            if (activeIngredient && activeIngredient.length > 0 && !enhancedComposition) {
              enhancedComposition = activeIngredient[0];
            }
          }
        }
      } catch (fdaErr) {
        // Silently swallow FDA errors to not block inventory creation
        // logger is imported
      }
    }

    const [newMedicine] = await getDb().insert(medicines).values({
      pharmacistId,
      name,
      genericName,
      description: enhancedDescription,
      imageUrl,
      composition: enhancedComposition,
      dosageForm,
      manufacturer,
      price: Number(price),
      stockQuantity: Number(stockQuantity || 0),
      prescriptionTier: prescriptionTier || "otc",
      category
    }).returning();

    await invalidateCachePrefix("medicines:");

    res.status(201).json({ medicine: newMedicine });
  } catch (error) {
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

export default router;
