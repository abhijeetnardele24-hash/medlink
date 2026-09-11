import { useState, useEffect } from 'react';

export const useICD10Search = () => {
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<{code: string, name: string} | null>(null);
  const [isSearchingDiagnosis, setIsSearchingDiagnosis] = useState(false);

  useEffect(() => {
    if (!diagnosisQuery.trim()) {
      setDiagnosisResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDiagnosis(true);
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=${encodeURIComponent(diagnosisQuery)}`);
        const data = await res.json();
        // data format: [count, [codes], null, [[code, name], ...]]
        setDiagnosisResults(data[3] || []);
      } catch (err) {
        console.error("Failed to fetch ICD-10 codes:", err);
      } finally {
        setIsSearchingDiagnosis(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [diagnosisQuery]);

  return {
    diagnosisQuery,
    setDiagnosisQuery,
    diagnosisResults,
    setDiagnosisResults,
    selectedDiagnosis,
    setSelectedDiagnosis,
    isSearchingDiagnosis
  };
};
