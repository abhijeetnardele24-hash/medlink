import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { getDb } from "../db";
import { encounters, messages, appointments, patients, doctors, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../errors";

const router = Router({ mergeParams: true }); // mergeParams lets us access :id from parent

const requireEncounterParticipant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = getDb();
    const encounterId = req.params.id as string;
    const userId = (req as any).user.id as string;

    const [result] = await db
      .select({
        encounter: encounters,
        patientUserId: patients.userId,
        doctorUserId: doctors.userId,
      })
      .from(encounters)
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(encounters.id, encounterId));

    if (!result) {
      throw new NotFoundError("Encounter not found");
    }

    if (result.patientUserId !== userId && result.doctorUserId !== userId) {
      throw new ForbiddenError("Not authorized to access this encounter's messages");
    }

    (req as any).encounter = result.encounter;
    next();
  } catch (error) {
    next(error);
  }
};

router.use(requireEncounterParticipant);

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const encounterId = req.params.id as string;

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
    const encounterId = req.params.id as string;
    const userId = (req as any).user.id as string;

    const validated = postMessageSchema.parse(req.body);

    const [newMessage] = await db
      .insert(messages)
      .values({
        encounterId: encounterId,
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
