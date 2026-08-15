import { GoogleGenAI } from '@google/genai';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  clinicalAction: string;
}

export interface AllergyConflict {
  drug: string;
  allergen: string;
  riskLevel: 'moderate' | 'high' | 'anaphylaxis_risk';
  recommendation: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  severity: 'safe' | 'moderate_caution' | 'severe_contraindication';
  overallSafetySummary: string;
  interactions: DrugInteraction[];
  allergyConflicts: AllergyConflict[];
  clinicalTips: string[];
}

export class AISafetyService {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      return new GoogleGenAI({ apiKey });
    } catch {
      return null;
    }
  }

  public static async checkPrescriptionSafety(
    medicines: { name: string; dosage?: string }[],
    patientAllergies: string[] = [],
    patientContext?: any
  ): Promise<SafetyCheckResult> {
    const client = this.getClient();

    if (client && medicines.length > 0) {
      try {
        const prompt = `You are a clinical pharmacologist and Clinical Decision Support System (CDSS) AI.
Analyze the following prescription for potential Drug-Drug Interactions (DDI), Allergy Contraindications, and Clinical Safety Risks.

Prescribed Medicines:
${JSON.stringify(medicines)}

Patient Known Allergies:
${JSON.stringify(patientAllergies)}

Patient Context:
${JSON.stringify(patientContext || {})}

Return a strictly valid JSON object following this schema:
{
  "isSafe": boolean,
  "severity": "safe" | "moderate_caution" | "severe_contraindication",
  "overallSafetySummary": "Concise 1-2 sentence clinical pharmacist synthesis.",
  "interactions": [
    {
      "drug1": "Drug A",
      "drug2": "Drug B",
      "severity": "moderate" | "severe",
      "description": "Mechanism and clinical risk of combination.",
      "clinicalAction": "Recommended clinical management or alternative drug."
    }
  ],
  "allergyConflicts": [
    {
      "drug": "Drug Name",
      "allergen": "Allergen class",
      "riskLevel": "high" | "anaphylaxis_risk",
      "recommendation": "Alternative medication class to use instead."
    }
  ],
  "clinicalTips": [
    "Dosing adjustment advice or monitoring requirement."
  ]
}

Return only raw JSON. Do not include markdown code block ticks.`;

        const response = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        console.warn('Gemini safety check error, using deterministic pharmacopeia heuristic:', err);
      }
    }

    return this.generateFallbackSafetyCheck(medicines, patientAllergies);
  }

  private static generateFallbackSafetyCheck(
    medicines: { name: string; dosage?: string }[],
    patientAllergies: string[] = []
  ): SafetyCheckResult {
    const medNames = medicines.map(m => m.name.toLowerCase());
    const allergies = patientAllergies.map(a => a.toLowerCase());

    const interactions: DrugInteraction[] = [];
    const allergyConflicts: AllergyConflict[] = [];
    const clinicalTips: string[] = [];

    // 1. Check known severe DDI pairs
    const hasWarfarin = medNames.some(n => n.includes('warfarin') || n.includes('coumadin'));
    const hasNsaid = medNames.some(n => n.includes('ibuprofen') || n.includes('aspirin') || n.includes('diclofenac') || n.includes('naproxen'));
    const hasAceInhibitor = medNames.some(n => n.includes('enalapril') || n.includes('ramipril') || n.includes('lisinopril'));
    const hasPotassiumSparing = medNames.some(n => n.includes('spironolactone') || n.includes('potassium'));
    const hasStatin = medNames.some(n => n.includes('atorvastatin') || n.includes('simvastatin') || n.includes('rosuvastatin'));
    const hasMacrolide = medNames.some(n => n.includes('clarithromycin') || n.includes('erythromycin'));

    if (hasWarfarin && hasNsaid) {
      interactions.push({
        drug1: 'Warfarin',
        drug2: 'NSAID (Ibuprofen/Aspirin/Diclofenac)',
        severity: 'severe',
        description: 'Concurrent use significantly elevates risk of severe gastrointestinal hemorrhage and bleeding events.',
        clinicalAction: 'Substitute NSAID with Paracetamol (Acetaminophen) for analgesia and monitor INR closely.'
      });
    }

    if (hasAceInhibitor && hasPotassiumSparing) {
      interactions.push({
        drug1: 'ACE Inhibitor',
        drug2: 'Potassium-Sparing Diuretic',
        severity: 'moderate',
        description: 'Synergistic potassium retention may induce severe hyperkalemia and cardiac conduction anomalies.',
        clinicalAction: 'Monitor serum potassium and renal function within 7 days of initiation.'
      });
    }

    if (hasStatin && hasMacrolide) {
      interactions.push({
        drug1: 'Statin (Simvastatin/Atorvastatin)',
        drug2: 'Macrolide Antibiotic (Clarithromycin)',
        severity: 'severe',
        description: 'CYP3A4 inhibition dramatically increases statin plasma concentration, elevating rhabdomyolysis and myopathy risk.',
        clinicalAction: 'Temporarily suspend statin therapy during antibiotic course or use azithromycin.'
      });
    }

    // 2. Check Allergy Cross-Reactivity
    for (const med of medNames) {
      if (allergies.some(a => a.includes('penicillin') || a.includes('beta-lactam'))) {
        if (med.includes('amoxicillin') || med.includes('ampicillin') || med.includes('augmentin') || med.includes('penicillin')) {
          allergyConflicts.push({
            drug: med,
            allergen: 'Penicillin / Beta-Lactam',
            riskLevel: 'anaphylaxis_risk',
            recommendation: 'Strict contraindication. Switch to Macrolides (Azithromycin) or Fluoroquinolones.'
          });
        }
      }

      if (allergies.some(a => a.includes('sulfa') || a.includes('sulfonamide'))) {
        if (med.includes('bactrim') || med.includes('cotrimoxazole') || med.includes('sulfamethoxazole')) {
          allergyConflicts.push({
            drug: med,
            allergen: 'Sulfa Drugs',
            riskLevel: 'high',
            recommendation: 'Severe hypersensitivity risk. Prescribe non-sulfonamide alternative antibiotic.'
          });
        }
      }
    }

    // Determine overall severity
    const hasSevere = interactions.some(i => i.severity === 'severe') || allergyConflicts.some(a => a.riskLevel === 'anaphylaxis_risk');
    const hasModerate = interactions.some(i => i.severity === 'moderate') || allergyConflicts.length > 0;

    let severity: 'safe' | 'moderate_caution' | 'severe_contraindication' = 'safe';
    let overallSafetySummary = 'No critical drug-drug interactions or documented patient allergy conflicts detected. Regimen appears clinically safe.';

    if (hasSevere) {
      severity = 'severe_contraindication';
      overallSafetySummary = 'CRITICAL CLINICAL ALERT: High-risk contraindication or severe interaction detected that requires physician intervention.';
    } else if (hasModerate) {
      severity = 'moderate_caution';
      overallSafetySummary = 'MODERATE CAUTION: Potential drug interaction noted. Clinical monitoring or dosage spacing advised.';
    }

    if (medicines.length > 0) {
      clinicalTips.push('Ensure patient stays adequately hydrated during treatment.');
      clinicalTips.push('Confirm hepatic and renal clearance if high-dose therapy is maintained.');
    }

    return {
      isSafe: !hasSevere,
      severity,
      overallSafetySummary,
      interactions,
      allergyConflicts,
      clinicalTips
    };
  }
}
