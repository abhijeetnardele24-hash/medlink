import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AIScribeService } from '../services/aiScribe.service';
import { AILabReportService } from '../services/aiLabReport.service';
import { AISafetyService } from '../services/aiSafety.service';

const router = Router();

/**
 * POST /ai/scribe/generate-soap
 * Generates SOAP Notes, ICD-10 codes, and auto-prescriptions from consultation transcript
 */
router.post('/scribe/generate-soap', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, patientContext } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      res.status(400).json({ error: 'Transcript text is required' });
      return;
    }

    const result = await AIScribeService.generateSoapNotes(transcript, patientContext);
    res.json(result);
  } catch (err: any) {
    console.error('Error generating SOAP notes:', err);
    res.status(500).json({ error: 'Failed to generate clinical notes with AI' });
  }
});

/**
 * POST /ai/lab-report/analyze
 * Analyzes patient diagnostic blood tests/lab reports and returns structured biomarker intelligence
 */
router.post('/lab-report/analyze', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportText } = req.body;

    if (!reportText || typeof reportText !== 'string' || reportText.trim().length === 0) {
      res.status(400).json({ error: 'Report content text is required' });
      return;
    }

    const result = await AILabReportService.analyzeLabReport(reportText);
    res.json(result);
  } catch (err: any) {
    console.error('Error analyzing lab report:', err);
    res.status(500).json({ error: 'Failed to analyze lab report with AI' });
  }
});

/**
 * POST /ai/safety/ddi-check
 * Real-time Clinical Decision Support System (CDSS) for Drug-Drug Interactions & Allergy Warnings
 */
router.post('/safety/ddi-check', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { medicines, patientAllergies, patientContext } = req.body;

    if (!medicines || !Array.isArray(medicines)) {
      res.status(400).json({ error: 'Medicines array is required' });
      return;
    }

    const result = await AISafetyService.checkPrescriptionSafety(medicines, patientAllergies || [], patientContext);
    res.json(result);
  } catch (err: any) {
    console.error('Error checking prescription safety:', err);
    res.status(500).json({ error: 'Failed to check prescription safety with AI' });
  }
});

export default router;
