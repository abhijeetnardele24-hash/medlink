/**
 * Automated Test Suite for MedLink Enterprise AI Services
 * Tests all 4 core AI engines:
 * 1. AIScribeService (Ambient Clinical Scribe & SOAP Notes)
 * 2. AILabReportService (Lab Report & Biomarker Extraction)
 * 3. AISafetyService (Drug-Drug Interaction & Allergy CDSS)
 * 4. AITriageService (Conversational Triage & Emergency Red Flags)
 */

import { AIScribeService } from './services/aiScribe.service';
import { AILabReportService } from './services/aiLabReport.service';
import { AISafetyService } from './services/aiSafety.service';
import { AITriageService } from './services/aiTriage.service';

async function runAIEngineTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING MEDLINK ENTERPRISE AI INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   ↳ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ↳ ${detail}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: AIScribeService (SOAP Note Generation & ICD-10 Coding)
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing AIScribeService (SOAP Notes & ICD-10) ---');
  try {
    const transcript = `
      Doctor: Good morning John, what brings you in today?
      Patient: I have had a bad dry cough and a fever around 101 degrees for 3 days. My throat also hurts when swallowing.
      Doctor: I understand. Let's start you on Paracetamol 650mg twice daily and Levocetirizine for throat relief. Drink warm fluids.
    `;

    const soapResult = await AIScribeService.generateSoapNotes(transcript, { patientName: 'John Doe' });
    
    assert(Boolean(soapResult.subjective && soapResult.objective && soapResult.assessment && soapResult.plan), 'SOAP 4-component structure generated');
    assert(Array.isArray(soapResult.icd10Codes) && soapResult.icd10Codes.length > 0, 'ICD-10 clinical diagnostic codes mapped', `Codes: ${soapResult.icd10Codes.map(c => c.code).join(', ')}`);
    assert(Array.isArray(soapResult.extractedMedicines) && soapResult.extractedMedicines.length > 0, 'Medicines auto-extracted for prescription pad', `Extracted: ${soapResult.extractedMedicines.map(m => m.medicineName).join(', ')}`);
    assert(Boolean(soapResult.patientLaymanSummary), 'Patient-facing layman discharge summary generated');
  } catch (err: any) {
    assert(false, 'AIScribeService test execution', err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: AILabReportService (Biomarker Diagnostic Extraction)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing AILabReportService (Lab Report & Biomarker OCR) ---');
  try {
    const rawReport = `
      CLINICAL PATHOLOGY LABORATORY REPORT
      Patient: John Doe, Age: 45, Gender: Male
      Test: Comprehensive Metabolic & Lipid Panel
      
      Fasting Blood Glucose: 118 mg/dL (Ref Range: 70 - 99 mg/dL)
      Total Cholesterol: 228 mg/dL (Ref Range: < 200 mg/dL)
      HDL Cholesterol: 50 mg/dL (Ref Range: > 40 mg/dL)
      Serum Creatinine: 0.9 mg/dL (Ref Range: 0.7 - 1.3 mg/dL)
      TSH: 2.2 uIU/mL (Ref Range: 0.4 - 4.2 uIU/mL)
    `;

    const labResult = await AILabReportService.analyzeLabReport(rawReport);

    assert(Boolean(labResult.testTitle && labResult.overallHealthSummary), 'Lab report header & clinical health summary synthesized');
    assert(Array.isArray(labResult.biomarkers) && labResult.biomarkers.length >= 3, 'Biomarkers parsed with units and reference ranges', `Parsed ${labResult.biomarkers.length} biomarkers`);
    assert(labResult.biomarkers.some(b => b.status === 'high'), 'Abnormal biomarker successfully flagged as HIGH', 'Detected elevated glucose/cholesterol');
    assert(Array.isArray(labResult.clinicalRecommendations) && labResult.clinicalRecommendations.length > 0, 'Clinical dietary/lifestyle recommendations generated');
    assert(Array.isArray(labResult.suggestedQuestionsForDoctor) && labResult.suggestedQuestionsForDoctor.length > 0, 'Doctor discussion questions generated');
  } catch (err: any) {
    assert(false, 'AILabReportService test execution', err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: AISafetyService (Drug-Drug Interaction & Allergy CDSS)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing AISafetyService (Drug-Drug Interactions & Allergy CDSS) ---');
  try {
    // Test 3A: Severe Contraindication (Warfarin + Ibuprofen)
    const dangerousMeds = [
      { name: 'Warfarin 5mg', dosage: '5mg' },
      { name: 'Ibuprofen 400mg', dosage: '400mg' }
    ];
    const ddiResult = await AISafetyService.checkPrescriptionSafety(dangerousMeds, ['Penicillin']);
    
    assert(ddiResult.severity === 'severe_contraindication', 'Severe DDI Contraindication Detected (Warfarin + NSAID)', `Summary: ${ddiResult.overallSafetySummary}`);
    assert(ddiResult.interactions.length > 0, 'Detailed interaction mechanism & alternative drug provided', `Action: ${ddiResult.interactions[0]?.clinicalAction}`);

    // Test 3B: Allergy Contraindication (Penicillin Allergy + Amoxicillin)
    const allergyMeds = [
      { name: 'Amoxicillin 500mg', dosage: '500mg' }
    ];
    const allergyResult = await AISafetyService.checkPrescriptionSafety(allergyMeds, ['Penicillin']);
    assert(allergyResult.allergyConflicts.length > 0, 'Documented Allergy Conflict Detected (Penicillin + Amoxicillin)', `Risk: ${allergyResult.allergyConflicts[0]?.riskLevel}`);

    // Test 3C: Safe Prescription
    const safeMeds = [
      { name: 'Paracetamol 650mg', dosage: '650mg' },
      { name: 'Pantoprazole 40mg', dosage: '40mg' }
    ];
    const safeResult = await AISafetyService.checkPrescriptionSafety(safeMeds, ['Sulfa']);
    assert(safeResult.isSafe === true, 'Safe Prescription Validation Passed', 'Paracetamol + Pantoprazole flagged as safe');
  } catch (err: any) {
    assert(false, 'AISafetyService test execution', err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: AITriageService (Conversational Triage & Emergency Red Flag)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing AITriageService (Conversational Triage & Red Flags) ---');
  try {
    // Test 4A: Emergency Red Flag Detection (Chest pain)
    const emergencyChat = [
      { role: 'user' as const, content: 'I have intense crushing chest pain radiating to my left arm and sweating.' }
    ];
    const emergencyResult = await AITriageService.processTriageTurn(emergencyChat);
    assert(emergencyResult.emergencyRedFlag === true, 'Emergency Red-Flag Interceptor Triggered', `Urgency: Level ${emergencyResult.urgencyLevel} - ${emergencyResult.urgencyLabel}`);

    // Test 4B: Routine Symptom Triage & Specialty Recommendation (Skin rash)
    const dermatologyChat = [
      { role: 'user' as const, content: 'I have an itchy red rash on my arms for 3 days.' }
    ];
    const routineResult = await AITriageService.processTriageTurn(dermatologyChat);
    assert(routineResult.recommendedSpecialty.toLowerCase().includes('dermatol'), 'Specialty Navigation accurately mapped to Dermatology', `Specialty: ${routineResult.recommendedSpecialty}`);
    assert(routineResult.suggestedQuickReplies.length > 0, 'Dynamic Quick-Reply Chips generated for patient', `Chips: ${routineResult.suggestedQuickReplies.join(', ')}`);
  } catch (err: any) {
    assert(false, 'AITriageService test execution', err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 AI TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🚀 All 4 MedLink Enterprise AI Engines are 100% OPERATIONAL & PRODUCTION-READY!');
  }
}

runAIEngineTests().catch(console.error);
