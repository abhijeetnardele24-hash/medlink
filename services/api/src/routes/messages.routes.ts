import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { getDb } from "../db";
import { encounters, messages } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../errors";

const router = Router({ mergeParams: true }); // mergeParams lets us access :id from parent

const requireEncounterParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDb();
    const encounterId = req.params.id; // It's :id in encounters.routes.ts
    const userId = (req as any).user.uid;

    const [encounter] = await db
      .select()
      .from(encounters)
      .where(eq(encounters.id, encounterId));

    if (!encounter) {
      throw new NotFoundError("Encounter not found");
    }

    if (encounter.patientId !== userId && encounter.doctorId !== userId) {
      throw new ForbiddenError("Not authorized to access this encounter's messages");
    }

    (req as any).encounter = encounter;
    next();
  } catch (error) {
    next(error);
  }
};

router.use(requireEncounterParticipant);

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const encounterId = req.params.id;

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.encounterId, encounterId))
      .orderBy(asc(messages.createdAt));

    res.json({ messages: msgs });
  } catch (error) {
    next(error);
  }
});

const postMessageSchema = z.object({
  body: z.string().min(1),
  isSystemEvent: z.boolean().optional(),
});

router.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const encounterId = req.params.id;
    const userId = (req as any).user.uid;

    const validated = postMessageSchema.parse(req.body);

    const [newMessage] = await db
      .insert(messages)
      .values({
        encounterId,
        senderId: userId,
        body: validated.body,
        isSystemEvent: validated.isSystemEvent ?? false,
      })
      .returning();

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
});

export default router;
