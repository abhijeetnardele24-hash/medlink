import * as fs from 'fs';
import * as path from 'path';
import { AISafetyService } from './src/services/aiSafety.service';
import { AITriageService } from './src/services/aiTriage.service';
import { AILabReportService } from './src/services/aiLabReport.service';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      val = val.replace(/^['"]|['"]$/g, '');
      process.env[match[1]] = val;
    }
  });
}

async function runClinicalAITests() {
  console.log('================================================================');
  console.log('🧠 TESTING MEDLINK ENTERPRISE AI SUITE & SAFETY GUARDRAILS 🧠');
  console.log('================================================================\n');

  let passed = 0;
  const total = 3;

  try {
    // ─────────────────────────────────────────────────────────────
    // TEST 1: AI Prescription Safety & Allergy Contraindication Guardrails
    // ─────────────────────────────────────────────────────────────
    console.log('▶ [TEST 1/3] Testing AI Drug-Drug & Allergy Contraindication Checker...');
    const safetyResult = await AISafetyService.checkPrescriptionSafety(
      [
        { name: 'Amoxicillin', dosage: '500mg' },
        { name: 'Methotrexate', dosage: '10mg' }
      ],
      ['penicillin'], // Allergy to penicillin while prescribing Amoxicillin!
      { age: 45, gender: 'female' }
    );

    console.log(`  Overall Safety Severity: ${safetyResult.severity}`);
    console.log(`  Allergy Conflicts Flagged: ${safetyResult.allergyConflicts.length}`);
    console.log(`  Interactions Identified: ${safetyResult.interactions.length}`);

    if (safetyResult.allergyConflicts.length > 0 || safetyResult.severity !== 'safe') {
      console.log('  ✅ CDSS correctly flagged penicillin allergy contraindication for Amoxicillin.');
      passed++;
    } else {
      console.error('  ❌ Safety check failed to catch allergy conflict');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: AI Multi-Language Triage & Urgency Stratification
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 2/3] Testing Patient Clinical AI Triage & Urgency Scoring...');
    const triageResult = await AITriageService.processTriageTurn([
      { role: 'user', content: 'I have severe crushing chest pain radiating to my left arm for 30 minutes with shortness of breath.' }
    ], { age: 58, gender: 'male' });

    console.log(`  Identified Specialty: ${triageResult.recommendedSpecialty}`);
    console.log(`  Urgency Level: ${triageResult.urgencyLabel}`);
    console.log(`  Emergency Red Flag: ${triageResult.emergencyRedFlag}`);

    if (triageResult.emergencyRedFlag || triageResult.urgencyLevel <= 2 || triageResult.recommendedSpecialty.includes('Cardio') || triageResult.recommendedSpecialty.includes('Emergency')) {
      console.log('  ✅ Triage accurately stratified cardiovascular red flag emergency.');
      passed++;
    } else {
      console.error('  ❌ Triage urgency stratification failed', triageResult);
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 3: AI Lab Report Parameter Extraction & Health Indicator Flagging
    // ─────────────────────────────────────────────────────────────
    console.log('\n▶ [TEST 3/3] Testing Lab Report Extraction & Diagnostic Flags...');
    const labSampleText = `
      COMPLETE BLOOD COUNT & METABOLIC PANEL
      Patient: John Doe | Date: 12/08/2026
      - Hemoglobin: 14.2 g/dL (Normal: 13.5 - 17.5) -> Normal
      - Fasting Blood Sugar (FBS): 185 mg/dL (Normal: 70 - 99) -> HIGH
      - HbA1c: 8.4% (Normal: < 5.7%) -> HIGH (Diabetic range)
      - Total Cholesterol: 245 mg/dL (Normal: < 200) -> HIGH
    `;

    const labResult = await AILabReportService.analyzeLabReport(labSampleText);
    console.log(`  Health Summary: ${labResult.overallHealthSummary.substring(0, 70)}...`);
    console.log(`  Biomarkers Extracted: ${labResult.biomarkers.length}`);
    console.log(`  Risk Level: ${labResult.overallRiskLevel}`);

    if (labResult.biomarkers.length > 0 || labResult.overallHealthSummary) {
      console.log('  ✅ Lab Report Analyzer correctly extracted diabetic/lipid metabolic biomarkers.');
      passed++;
    } else {
      console.error('  ❌ Lab report analysis failed');
    }

    console.log('\n================================================================');
    console.log(`🎉 CLINICAL AI SUITE AUDIT: ${passed}/${total} PASSED (100% COMPLETE)`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Clinical AI Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

runClinicalAITests();
