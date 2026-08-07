import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { doctors, recommendationEvents } from "../db/schema";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody";

const router = Router();

const recommendationRequestSchema = z.object({
  patientId: z.string().uuid().optional(),
  concernCategory: z.string(),
  preferredLanguage: z.string().optional(),
  preferredMode: z.enum(["video", "audio", "async_chat", "offline"]).optional(),
});

// Very simple heuristic mapping (No ML needed for Phase 2)
const CONCERN_TO_SPECIALITY: Record<string, string> = {
  "skin concern": "Dermatology",
  "fever": "General Medicine",
  "heart issue": "Cardiology",
  "headache": "Neurology",
  "child health": "Pediatrics",
  "bone pain": "Orthopedics",
  "eye issue": "Ophthalmology",
  "mental health": "Psychiatry",
  "pregnancy": "Gynecology"
};

router.post(
  "/",
  validateBody(recommendationRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { patientId, concernCategory, preferredLanguage, preferredMode } = req.body;
    
    // 1. Map concern to speciality
    const lowerConcern = (concernCategory as string).toLowerCase();
    let suggestedSpeciality = "General Medicine"; // Default fallback
    
    for (const [key, spec] of Object.entries(CONCERN_TO_SPECIALITY)) {
      if (lowerConcern.includes(key)) {
        suggestedSpeciality = spec;
        break;
      }
    }

    // 2. Query all verified doctors (In a real app, we would query available slots too)
    const allDoctors = await getDb()
      .select({
        id: doctors.id,
        fullName: doctors.fullName,
        speciality: doctors.speciality,
        experienceYears: doctors.experienceYears,
        verificationStatus: doctors.verificationStatus
      })
      .from(doctors)
      .where(eq(doctors.verificationStatus, "verified"));

    // 3. Rank doctors
    // Speciality match gets highest weight.
    const ranked = allDoctors.map((doc) => {
      let score = 0;
      
      if (doc.speciality === suggestedSpeciality) score += 50;
      
      // Simulate availability/experience scoring
      score += (doc.experienceYears || 0); // more experience gives slight edge
      
      // Add random fuzzing to simulate availability matching
      score += Math.floor(Math.random() * 10);
      
      // Language match & Mode match logic can be expanded here. 
      // For Phase 2, we just boost score by 15 if language was requested (simulating a match).
      if (preferredLanguage) score += 15;
      if (preferredMode) score += 10;

      return { doctor: doc, score };
    });

    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);
    
    // Take top 5 recommendations
    const topRecommendations = ranked.slice(0, 5).filter(r => r.score >= 50);

    const rankedDoctorIds = topRecommendations.map(r => r.doctor.id);

    // 4. Generate plain-language explanation
    const explanation = `Suggested because you selected a ${concernCategory} concern${
      preferredLanguage ? `, ${preferredLanguage} language` : ""
    }${preferredMode ? `, and ${preferredMode} consultation` : ""}. This is not a medical diagnosis.`;

    // 5. Log event to database
    await getDb().insert(recommendationEvents).values({
      patientId: patientId || null,
      selectedCategory: concernCategory,
      preferredLanguage: preferredLanguage || null,
      preferredMode: preferredMode || null,
      suggestedSpeciality,
      rankedDoctorIds,
      explanationVersion: "v1"
    });

    // 6. Return response
    res.json({
      success: true,
      concernCategory,
      suggestedSpeciality,
      explanation,
      recommendations: topRecommendations.map(r => ({
        doctorId: r.doctor.id,
        fullName: r.doctor.fullName,
        speciality: r.doctor.speciality,
        matchScore: r.score
      }))
    });
  }
);

export default router;
