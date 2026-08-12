import fs from 'fs';
import path from 'path';

const routesPath = path.join(__dirname, 'src', 'routes', 'pharmacy.routes.ts');
let content = fs.readFileSync(routesPath, 'utf8');

const newRoute = `
// GET /pharmacy/orders (for patient)
router.get("/orders", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!userRows.length) { res.status(401).json({ error: "User not found" }); return; }
    
    const patientRows = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, userRows[0].id)).limit(1);
    if (!patientRows.length) { res.status(403).json({ error: "Only patients can view orders" }); return; }
    
    const orders = await getDb()
      .select({
        id: pharmacyOrders.id,
        totalAmount: pharmacyOrders.totalAmount,
        status: pharmacyOrders.status,
        attachmentUrl: pharmacyOrders.attachmentUrl,
        createdAt: pharmacyOrders.createdAt,
        pharmacistName: pharmacists.shopName,
        razorpayOrderId: pharmacyOrders.razorpayOrderId,
      })
      .from(pharmacyOrders)
      .innerJoin(pharmacists, eq(pharmacists.id, pharmacyOrders.pharmacistId))
      .where(eq(pharmacyOrders.patientId, patientRows[0].id))
      .orderBy(pharmacyOrders.createdAt);
      
    res.json(orders);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch orders");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});
`;

content = content.replace('// POST /pharmacy/orders\nrouter.post("/",', newRoute + '\n// POST /pharmacy/orders\nrouter.post("/",');
fs.writeFileSync(routesPath, content);
console.log('Added GET /orders');
