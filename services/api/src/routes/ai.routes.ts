import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AIScribeService } from '../services/aiScribe.service';

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

export default router;
