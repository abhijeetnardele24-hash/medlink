import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { doctors, recommendationEvents } from "../db/schema";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody";
import { GoogleGenAI } from '@google/genai';
import { logger } from "../logger";

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}


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
    
    // 1. AI Smart Triage (or dictionary fallback)

    const lowerConcern = (concernCategory as string).toLowerCase();
    let suggestedSpeciality = "General Medicine"; // Default fallback
    let explanation = `Suggested because you selected a ${concernCategory} concern${
      preferredLanguage ? `, ${preferredLanguage} language` : ""
    }${preferredMode ? `, and ${preferredMode} consultation` : ""}. This is not a medical diagnosis.`;

    if (ai) {
      try {
        const prompt = `
          You are an intelligent medical triage assistant. 
          A patient has the following concern/symptoms: "${concernCategory}".
          Map this to ONE of the following medical specialties exactly:
          Dermatology, General Medicine, Cardiology, Neurology, Pediatrics, Orthopedics, Ophthalmology, Psychiatry, Gynecology.
          If it does not fit perfectly, default to General Medicine.
          
          Respond in strict JSON format:
          {
            "speciality": "The exact specialty name",
            "explanation": "A short, empathetic, patient-friendly explanation of why this specialty is recommended. Do not diagnose."
          }
        `;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response.text) {
          // Attempt to parse JSON from the response text
          const cleanText = response.text.replace(/\s*\x60\x60\x60json\s*/g, '').replace(/\s*\x60\x60\x60\s*/g, '').trim();
          const parsed = JSON.parse(cleanText);
          
          if (parsed.speciality) {
            suggestedSpeciality = parsed.speciality;
          }
          if (parsed.explanation) {
            explanation = parsed.explanation;
          }
        }
      } catch (err) {
        logger.warn({ err }, "Gemini AI triage failed. Falling back to dictionary mapping.");
        // Fallback dictionary mapping
        for (const [key, spec] of Object.entries(CONCERN_TO_SPECIALITY)) {
          if (lowerConcern.includes(key)) {
            suggestedSpeciality = spec;
            break;
          }
        }
      }
    } else {
      // Fallback dictionary mapping
      for (const [key, spec] of Object.entries(CONCERN_TO_SPECIALITY)) {
        if (lowerConcern.includes(key)) {
          suggestedSpeciality = spec;
          break;
        }
      }
    }


    // 2. Query all verified doctors
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
    const ranked = allDoctors.map((doc) => {
      let score = 0;
      if (doc.speciality === suggestedSpeciality) score += 50;
      score += (doc.experienceYears || 0);
      score += Math.floor(Math.random() * 10);
      if (preferredLanguage) score += 15;
      if (preferredMode) score += 10;
      return { doctor: doc, score };
    });

    // Sort descending by score
    ranked.sort((a, b) => b.score - a.score);
    
    // Take top 5 recommendations
    const topRecommendations = ranked.slice(0, 5).filter(r => r.score >= 50);

    const rankedDoctorIds = topRecommendations.map(r => r.doctor.id);

    // 4. Log event to database
    await getDb().insert(recommendationEvents).values({
      patientId: patientId || null,
      selectedCategory: concernCategory,
      preferredLanguage: preferredLanguage || null,
      preferredMode: preferredMode || null,
      suggestedSpeciality,
      rankedDoctorIds,
      explanationVersion: ai ? "v2_gemini" : "v1_heuristic"
    });

    // 5. Return response
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
