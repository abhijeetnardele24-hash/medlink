import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";
import multer from "multer";
import { getFirebaseAdmin } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";
import { attachments } from "../db/schema";
import { logger } from "../logger";
import { eq } from "drizzle-orm";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(authenticate);

router.post("/", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const bucket = getFirebaseAdmin().storage().bucket();
    const fileName = `attachments/${res.locals.user.uid}/${uuidv4()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    const storagePath = `gs://${bucket.name}/${fileName}`;

    const [attachment] = await getDb()
      .insert(attachments)
      .values({
        ownerId: res.locals.user.uid,
        storageKey: storagePath,
        contentType: file.mimetype,
        byteSize: file.size,
        checksum: "uploaded",
        scanStatus: "clean",
      })
      .returning();

    res.status(201).json(attachment);
  } catch (err: any) {
    logger.error({ err }, "File upload failed");
    res.status(500).json({ error: "File upload failed" });
  }
});

router.get("/:id/url", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db: any = getDb();
    
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id as any, id)).limit(1);
    
    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }
    
    const storageKey = attachment.storageKey;
    const bucket = getFirebaseAdmin().storage().bucket();
    const fileNameMatch = storageKey.match(/gs:\/\/[^\/]+\/(.+)/);
    
    if (!fileNameMatch) {
      res.status(500).json({ error: "Invalid storage key" });
      return;
    }
    
    const file = bucket.file(fileNameMatch[1]);
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });
    
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate URL" });
  }
});

export default router;
