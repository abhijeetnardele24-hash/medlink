import React, { useState, useEffect } from 'react';
import { X, Search, Plus, CheckCircle, Package } from 'lucide-react';
import { api } from '../lib/api';

interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface PrescribedMedicine {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  recommend: boolean;
}

interface PrescribeModalProps {
  encounterId: string;
  doctorId: string;
  initialMedicines?: PrescribedMedicine[];
  initialDiagnosis?: { code: string; name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrescribeModal: React.FC<PrescribeModalProps> = ({
  encounterId,
  doctorId,
  initialMedicines,
  initialDiagnosis,
  onClose,
  onSuccess
}) => {
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>(initialMedicines || []);
  const [instructions, setInstructions] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Diagnosis State (ICD-10)
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [diagnosisResults, setDiagnosisResults] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<{code: string, name: string} | null>(initialDiagnosis || null);
  const [isSearchingDiagnosis, setIsSearchingDiagnosis] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/medicines?search=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.medicines || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounced search for ICD-10 Diagnoses via ClinicalTables API
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

  const addMedicine = (med: Medicine) => {
    if (medicines.some(m => m.medicineId === med.id)) return;
    setMedicines(prev => [...prev, {
      medicineId: med.id,
      name: med.name,
      dosage: '',
      frequency: '',
      duration: '',
      recommend: true
    }]);
    setSearchQuery('');
  };

  const updateMedicine = (id: string, field: keyof PrescribedMedicine, value: any) => {
    setMedicines(prev => prev.map(m => m.medicineId === id ? { ...m, [field]: value } : m));
  };

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.medicineId !== id));
  };

  const handleSubmit = async () => {
    if (medicines.length === 0 && !instructions.trim() && !selectedDiagnosis) {
      alert("Please add at least one medicine, diagnosis, or instructions.");
      return;
    }
    setSubmitting(true);

    let finalInstructions = instructions;
    if (selectedDiagnosis) {
      finalInstructions = `Diagnosis: ${selectedDiagnosis.code} - ${selectedDiagnosis.name}\n\n${finalInstructions}`.trim();
    }

    try {
      await api.post(`/encounters/${encounterId}/prescriptions`, {
        doctorId,
        medicinesJson: medicines,
        instructionsText: finalInstructions
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to issue prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package size={24} className="text-blue-500" /> Issue Prescription
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          {/* Left Column: Search & Add */}
          <div className="w-1/3 flex flex-col gap-4 border-r border-white/10 pr-6">
            <h3 className="font-semibold text-white/80">Search Pharmacy Catalog</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-[300px] border border-white/5 rounded-lg bg-black/20 p-2 space-y-2">
              {isSearching ? (
                <div className="text-center text-white/50 py-4 text-sm">Searching...</div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="text-center text-white/50 py-4 text-sm">No medicines found.</div>
              ) : (
                searchResults.map(res => (
                  <div key={res.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-start hover:border-blue-500/50 transition-colors">
                    <div>
                      <div className="font-semibold text-white/90 text-sm">{res.name}</div>
                      <div className="text-xs text-white/50">{res.category}</div>
                    </div>
                    <button 
                      onClick={() => addMedicine(res)}
                      className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500 hover:text-white transition-colors"
                      disabled={medicines.some(m => m.medicineId === res.id)}
                    >
                      {medicines.some(m => m.medicineId === res.id) ? <CheckCircle size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Prescribed Medicines */}
          <div className="w-2/3 flex flex-col gap-6">
            <div>
              <h3 className="font-semibold text-white/80 mb-4">Prescribed Medicines</h3>
              {medicines.length === 0 ? (
                <div className="text-center p-8 bg-white/5 border border-white/10 rounded-xl text-white/40">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Search and add medicines from the catalog</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicines.map((med) => (
                    <div key={med.medicineId} className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
                      <button onClick={() => removeMedicine(med.medicineId)} className="absolute top-4 right-4 text-white/30 hover:text-red-400 transition-colors">
                        <X size={18} />
                      </button>
                      <h4 className="font-bold text-blue-400 mb-3">{med.name}</h4>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500mg)"
                          value={med.dosage}
                          onChange={(e) => updateMedicine(med.medicineId, 'dosage', e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Frequency (e.g. 1-0-1)"
                          value={med.frequency}
                          onChange={(e) => updateMedicine(med.medicineId, 'frequency', e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 5 Days)"
                          value={med.duration}
                          onChange={(e) => updateMedicine(med.medicineId, 'duration', e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                        <input 
                          type="checkbox" 
                          checked={med.recommend} 
                          onChange={(e) => updateMedicine(med.medicineId, 'recommend', e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-blue-500/50"
                        />
                        <span className="text-sm text-white/80">Tag as <span className="font-semibold text-blue-400">Doctor Recommended</span> (adds trust signal to pharmacy marketplace)</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-4">
              {/* Diagnosis Field */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold text-white/80 mb-3 flex items-center gap-2">
                  <Search size={16} /> ICD-10 Diagnosis
                </h3>
                {selectedDiagnosis ? (
                  <div className="flex justify-between items-center bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg">
                    <div>
                      <span className="font-bold text-blue-400">{selectedDiagnosis.code}</span>
                      <span className="text-white ml-2">{selectedDiagnosis.name}</span>
                    </div>
                    <button onClick={() => setSelectedDiagnosis(null)} className="text-white/50 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search condition (e.g., Asthma, J00)..."
                      value={diagnosisQuery}
                      onChange={(e) => setDiagnosisQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-blue-500"
                    />
                    {diagnosisQuery && (
                      <div className="absolute z-10 w-full mt-1 bg-[#2a2a2a] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {isSearchingDiagnosis ? (
                          <div className="p-3 text-center text-white/50 text-sm">Searching ICD-10...</div>
                        ) : diagnosisResults.length === 0 ? (
                          <div className="p-3 text-center text-white/50 text-sm">No codes found.</div>
                        ) : (
                          diagnosisResults.map((res, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedDiagnosis({ code: res[0], name: res[1] });
                                setDiagnosisQuery('');
                                setDiagnosisResults([]);
                              }}
                              className="w-full text-left p-3 hover:bg-white/10 border-b border-white/5 flex gap-3 items-start last:border-0 transition-colors"
                            >
                              <span className="font-bold text-blue-400 shrink-0">{res[0]}</span>
                              <span className="text-white/80 text-sm">{res[1]}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Instructions Field */}
              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-white/80 mb-2">Clinical Instructions</h3>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Add general advice, diet restrictions, or next steps..."
                  className="w-full flex-1 min-h-[120px] bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors font-semibold">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || (medicines.length === 0 && !instructions.trim() && !selectedDiagnosis)}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Issuing...' : <><CheckCircle size={18} /> Issue Prescription & End Call</>}
          </button>
        </div>
      </div>
    </div>
  );
};
