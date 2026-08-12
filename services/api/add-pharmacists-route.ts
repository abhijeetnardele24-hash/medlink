import fs from 'fs';
import path from 'path';

const routesPath = path.join(__dirname, 'src', 'routes', 'pharmacy.routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

const newRoute = `
// GET /pharmacy/pharmacists
router.get("/pharmacists", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbPharmacists = await getDb()
      .select({
        id: pharmacists.id,
        fullName: pharmacists.fullName,
        shopName: pharmacists.shopName,
        registeredAddress: pharmacists.registeredAddress,
      })
      .from(pharmacists)
      .where(eq(pharmacists.verificationStatus, "verified"));
    res.json(dbPharmacists);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch pharmacists");
    res.status(500).json({ error: "Failed to fetch pharmacists" });
  }
});
`;

content = content.replace('// POST /pharmacy/orders/incoming', newRoute + '\n// POST /pharmacy/orders/incoming');
content = content.replace('// GET /pharmacy/orders/incoming', newRoute + '\n// GET /pharmacy/orders/incoming');
fs.writeFileSync(routesPath, content);
console.log('Added GET /pharmacists');
