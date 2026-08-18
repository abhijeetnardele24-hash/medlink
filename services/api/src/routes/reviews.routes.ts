import { Router } from "express";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { getDb } from "../db/client";
import { doctorReviews, doctors, patients, users } from "../db/schema";

const router = Router();

// GET /doctors/:id/reviews - Get all reviews for a specific doctor
router.get("/:id/reviews", async (req, res) => {
  try {
    const doctorId = req.params.id;
    const db = await getDb();

    // Fetch the reviews
    const reviews = await db
      .select({
        id: doctorReviews.id,
        rating: doctorReviews.rating,
        comment: doctorReviews.comment,
        reply: doctorReviews.reply,
        createdAt: doctorReviews.createdAt,
        patient: {
          id: patients.id,
          name: users.name,
        }
      })
      .from(doctorReviews)
      .innerJoin(patients, eq(doctorReviews.patientId, patients.id))
      .innerJoin(users, eq(patients.userId, users.id))
      .where(eq(doctorReviews.doctorId, doctorId))
      .orderBy(desc(doctorReviews.createdAt));

    // Calculate stats
    const stats = await db
      .select({
        averageRating: avg(doctorReviews.rating),
        totalReviews: count(doctorReviews.id),
      })
      .from(doctorReviews)
      .where(eq(doctorReviews.doctorId, doctorId));

    res.json({
      reviews,
      stats: {
        averageRating: stats[0]?.averageRating ? Number(stats[0].averageRating).toFixed(1) : "0.0",
        totalReviews: stats[0]?.totalReviews || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching doctor reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /doctors/:id/reviews - Patient posts a review for a doctor
router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    const db = await getDb();

    // Find the patient record for this user
    const patientRecord = await db.query.patients.findFirst({
      where: eq(patients.userId, userId),
    });

    if (!patientRecord) {
      return res.status(403).json({ error: "Only patients can leave reviews" });
    }

    // Insert the review
    const [newReview] = await db
      .insert(doctorReviews)
      .values({
        doctorId,
        patientId: patientRecord.id,
        rating,
        comment,
      })
      .returning();

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error posting doctor review:", error);
    res.status(500).json({ error: "Failed to post review" });
  }
});

// PATCH /doctors/reviews/:reviewId/reply - Doctor replies to a review
router.patch("/reviews/:reviewId/reply", requireAuth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const { reply } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!reply) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    const db = await getDb();

    // Verify that the logged-in user is the doctor for this review
    const doctorRecord = await db.query.doctors.findFirst({
      where: eq(doctors.userId, userId),
    });

    if (!doctorRecord) {
      return res.status(403).json({ error: "Only doctors can reply to reviews" });
    }

    const review = await db.query.doctorReviews.findFirst({
      where: eq(doctorReviews.id, reviewId),
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.doctorId !== doctorRecord.id) {
      return res.status(403).json({ error: "You can only reply to reviews on your own profile" });
    }

    // Update the review with the reply
    const [updatedReview] = await db
      .update(doctorReviews)
      .set({
        reply,
        updatedAt: new Date(),
      })
      .where(eq(doctorReviews.id, reviewId))
      .returning();

    res.json(updatedReview);
  } catch (error) {
    console.error("Error replying to doctor review:", error);
    res.status(500).json({ error: "Failed to reply to review" });
  }
});

export { router as reviewsRouter };
