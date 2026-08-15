import { GoogleGenAI } from '@google/genai';

export interface TriageMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TriageEvaluationResult {
  nextAssistantQuestion: string;
  isAssessmentComplete: boolean;
  emergencyRedFlag: boolean;
  emergencyReason?: string;
  urgencyLevel: 1 | 2 | 3 | 4 | 5; // 1 = Emergency ER, 2 = Urgent (1h), 3 = Same Day, 4 = Routine, 5 = Self-Care
  urgencyLabel: string;
  recommendedSpecialty: string;
  probableConditions: { condition: string; likelihood: 'high' | 'moderate' | 'possible' }[];
  clinicalIntakeSummary: string; // 30-second brief for the doctor
  suggestedQuickReplies: string[];
}

export class AITriageService {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    try {
      return new GoogleGenAI({ apiKey });
    } catch {
      return null;
    }
  }

  public static async processTriageTurn(
    conversation: TriageMessage[],
    patientContext?: any
  ): Promise<TriageEvaluationResult> {
    const client = this.getClient();

    if (client && conversation.length > 0) {
      try {
        const prompt = `You are an expert Clinical Triage AI Navigator (like Infermedica / NHS 111 Triage Engine).
Conduct an empathetic, scientifically rigorous pre-consultation symptom triage dialogue with the patient.

Conversation So Far:
${conversation.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Patient Demographics / Context:
${JSON.stringify(patientContext || {})}

Instructions:
1. Check for IMMEDIATE emergency red flags (crushing chest pain radiating to arm, sudden unilateral weakness/facial droop, acute severe shortness of breath, anaphylaxis, severe head trauma).
2. If red flag is present, set "emergencyRedFlag": true and advise immediate emergency service contact.
3. If more clinical clarity is needed (e.g. duration, pain severity 1-10, fever presence, radiating pain), ask ONE targeted follow-up question and provide 3-4 quick-reply chips.
4. If sufficient information exists (after 2-3 turns or clear symptoms), set "isAssessmentComplete": true, provide probable conditions, urgency level, and recommend the best medical specialty.

Return a strictly valid JSON object following this schema:
{
  "nextAssistantQuestion": "Empathetic response and clear question to patient.",
  "isAssessmentComplete": boolean,
  "emergencyRedFlag": boolean,
  "emergencyReason": "Explanation if red flag",
  "urgencyLevel": 1 | 2 | 3 | 4 | 5,
  "urgencyLabel": "e.g. Immediate Emergency / Urgent Consultation / Same-Day Care / Routine / Self-Care",
  "recommendedSpecialty": "e.g. Cardiologist / Pulmonologist / Dermatologist / General Physician / Gastroenterologist",
  "probableConditions": [
    {"condition": "Condition Name", "likelihood": "high" | "moderate" | "possible"}
  ],
  "clinicalIntakeSummary": "Concise 3-line clinical brief with chief complaint, duration, and associated symptoms for the doctor.",
  "suggestedQuickReplies": ["Option A", "Option B", "Option C"]
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
        console.warn('Gemini triage error, using clinical fallback engine:', err);
      }
    }

    return this.generateFallbackTriage(conversation);
  }

  private static generateFallbackTriage(conversation: TriageMessage[]): TriageEvaluationResult {
    const fullText = conversation.map(c => c.content.toLowerCase()).join(' ');

    // 1. Red Flag Detection
    const isChestPain = fullText.includes('chest pain') || (fullText.includes('chest') && fullText.includes('pressure'));
    const isStrokeSign = fullText.includes('slurred') || fullText.includes('numbness on one side') || fullText.includes('droop');
    const isSevereBreathing = fullText.includes('cannot breathe') || fullText.includes('gasping');

    if (isChestPain || isStrokeSign || isSevereBreathing) {
      return {
        nextAssistantQuestion: '⚠️ WARNING: Your reported symptoms indicate a potential high-risk medical emergency. Please seek immediate emergency medical care (call 108 or 911) or visit the nearest emergency room immediately.',
        isAssessmentComplete: true,
        emergencyRedFlag: true,
        emergencyReason: isChestPain ? 'Possible acute cardiac ischemia / heart emergency.' : 'Possible acute neurological / respiratory emergency.',
        urgencyLevel: 1,
        urgencyLabel: 'Immediate Emergency Care',
        recommendedSpecialty: 'Emergency Medicine / Cardiology',
        probableConditions: [
          { condition: 'Acute Coronary Syndrome / Angina', likelihood: 'high' },
          { condition: 'Cardiac Arrhythmia', likelihood: 'moderate' }
        ],
        clinicalIntakeSummary: 'Patient reports acute chest pain / severe distress. Emergency escalation triggered.',
        suggestedQuickReplies: ['Call Emergency Services', 'Find Nearest Hospital']
      };
    }

    // 2. Specialty & Condition routing
    const hasSkin = fullText.includes('rash') || fullText.includes('itching') || fullText.includes('skin') || fullText.includes('acne');
    const hasStomach = fullText.includes('stomach') || fullText.includes('acid') || fullText.includes('vomit') || fullText.includes('diarrhea');
    const hasCough = fullText.includes('cough') || fullText.includes('fever') || fullText.includes('sore throat') || fullText.includes('cold');

    if (conversation.length <= 2) {
      if (hasSkin) {
        return {
          nextAssistantQuestion: 'I understand you are experiencing skin symptoms. How long has the rash or irritation been present, and is it spreading or accompanied by a fever?',
          isAssessmentComplete: false,
          emergencyRedFlag: false,
          urgencyLevel: 4,
          urgencyLabel: 'Routine Specialist Care',
          recommendedSpecialty: 'Dermatology',
          probableConditions: [
            { condition: 'Contact Dermatitis', likelihood: 'moderate' },
            { condition: 'Allergic Urticaria', likelihood: 'possible' }
          ],
          clinicalIntakeSummary: 'Cutaneous irritation / rash investigation.',
          suggestedQuickReplies: ['Less than 2 days', 'About a week', 'It is itchy with no fever', 'Mild burning sensation']
        };
      }

      if (hasStomach) {
        return {
          nextAssistantQuestion: 'I note you have abdominal discomfort. Is the pain sharp or cramping, and does it worsen before or after meals?',
          isAssessmentComplete: false,
          emergencyRedFlag: false,
          urgencyLevel: 3,
          urgencyLabel: 'Same-Day Tele-Consultation',
          recommendedSpecialty: 'Gastroenterology / General Medicine',
          probableConditions: [
            { condition: 'Acute Gastritis / GERD', likelihood: 'high' },
            { condition: 'Gastroenteritis', likelihood: 'moderate' }
          ],
          clinicalIntakeSummary: 'Gastric discomfort with postprandial distress.',
          suggestedQuickReplies: ['Burning pain after eating', 'Cramping with nausea', 'Started today', 'Mild bloating']
        };
      }

      return {
        nextAssistantQuestion: 'Thank you for sharing. Could you tell me how many days you have had these symptoms, and if your body temperature has exceeded 100°F?',
        isAssessmentComplete: false,
        emergencyRedFlag: false,
        urgencyLevel: 3,
        urgencyLabel: 'Standard Tele-Consultation',
        recommendedSpecialty: 'General Physician',
        probableConditions: [
          { condition: 'Viral Upper Respiratory Infection', likelihood: 'moderate' }
        ],
        clinicalIntakeSummary: 'Symptom onset review.',
        suggestedQuickReplies: ['1 to 3 days', 'Mild fever (under 100°F)', 'No fever, just tiredness', 'Over 4 days']
      };
    }

    // Complete assessment
    return {
      nextAssistantQuestion: 'Based on our evaluation, your symptoms are characteristic of a mild to moderate condition that can be effectively diagnosed and treated via video consultation today. Would you like to book an appointment with our specialist?',
      isAssessmentComplete: true,
      emergencyRedFlag: false,
      urgencyLevel: 3,
      urgencyLabel: 'Same-Day Video Consultation',
      recommendedSpecialty: hasSkin ? 'Dermatology' : hasStomach ? 'Gastroenterology' : hasCough ? 'Pulmonology / General Medicine' : 'General Physician',
      probableConditions: [
        { condition: hasSkin ? 'Contact Dermatitis / Eczema' : hasStomach ? 'Acute Acid Peptic Disorder / Gastritis' : 'Upper Respiratory Tract Infection', likelihood: 'high' },
        { condition: 'Viral Pharyngitis / Seasonal Allergy', likelihood: 'moderate' }
      ],
      clinicalIntakeSummary: `Patient presented with ${hasSkin ? 'dermatological' : hasStomach ? 'gastrointestinal' : 'respiratory'} complaints lasting several days. No red-flag hemodynamic instability observed.`,
      suggestedQuickReplies: ['Book Video Consultation Now', 'Ask Another Question']
    };
  }
}
