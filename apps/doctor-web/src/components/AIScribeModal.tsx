import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Copy,
  Check,
  FileText,
  Pill,
  Heart,
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { api } from '../lib/api';

interface AIScribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  encounterId: string;
  patientName?: string;
  onAutoFillPrescription?: (medicines: any[]) => void;
}

export const AIScribeModal: React.FC<AIScribeModalProps> = ({
  isOpen,
  onClose,
  encounterId,
  patientName = 'Patient',
  onAutoFillPrescription
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeTab, setActiveTab] = useState<'soap' | 'prescription' | 'patientSummary' | 'safety'>('soap');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [soapData, setSoapData] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API for Ambient Clinical Listening
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type or paste the consultation notes below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  const handleGenerateSoap = async () => {
    if (!transcript.trim()) {
      alert('Please speak or enter some dialogue in the transcription box first.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post('/ai/scribe/generate-soap', {
        transcript,
        patientContext: {
          encounterId,
          patientName
        }
      });

      setSoapData(res.data);
      setActiveTab('soap');
    } catch (err) {
      console.error('Failed to generate SOAP notes', err);
      alert('Failed to generate clinical notes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferToPrescription = () => {
    if (soapData?.extractedMedicines && onAutoFillPrescription) {
      onAutoFillPrescription(soapData.extractedMedicines);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-['Inter',sans-serif]">
      <div className="bg-[#18181B] border border-white/10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-xl font-['Manrope']">AI Clinical Scribe & SOAP Copilot</h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                  DAX ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-white/50">Ambient real-time transcription and ICD-10 clinical documentation</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleListening}
              className={`px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              <span>{isListening ? 'Listening (Live)...' : 'Start Ambient Scribe'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Live Audio Transcription Feed */}
          <div className="w-2/5 border-r border-white/10 p-5 flex flex-col bg-black/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
                <Edit3 size={14} className="text-blue-400" /> Live Transcript / Dialogue
              </span>
              <button
                onClick={() => setTranscript('')}
                className="text-[11px] text-white/40 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Live speech will stream here automatically as you and the patient talk, or you can paste clinical notes here..."
              className="flex-1 w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
            />

            <div className="pt-4 flex gap-2">
              <button
                onClick={handleGenerateSoap}
                disabled={isGenerating || !transcript.trim()}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{isGenerating ? 'Synthesizing SOAP Notes...' : 'Generate SOAP Notes with AI'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Structured AI Clinical Documentation */}
          <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900/60">
            {/* Tabs Header */}
            <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'soap', label: 'SOAP Note', icon: <FileText size={15} /> },
                  { id: 'prescription', label: 'Prescriptions', icon: <Pill size={15} /> },
                  { id: 'patientSummary', label: 'Patient Summary', icon: <Heart size={15} /> },
                  { id: 'safety', label: 'Safety Cautions', icon: <AlertTriangle size={15} /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      activeTab === t.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {soapData && (
                <button
                  onClick={() => handleCopyText(JSON.stringify(soapData, null, 2))}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs flex items-center gap-1.5 transition-all border border-white/10"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy All'}</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {!soapData ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/40 max-w-sm mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-purple-400">
                    <Sparkles size={28} />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">Ready for Live Clinical Documentation</h4>
                  <p className="text-xs text-white/50">
                    Click <strong>'Start Ambient Scribe'</strong> to capture dialogue or paste consultation notes on the left, then click Generate.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tab 1: SOAP Note */}
                  {activeTab === 'soap' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* ICD-10 Badges */}
                      {soapData.icd10Codes && soapData.icd10Codes.length > 0 && (
                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block mb-2">
                            ICD-10 Clinical Diagnostic Codes
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {soapData.icd10Codes.map((c: any, i: number) => (
                              <span
                                key={i}
                                className="bg-purple-900/60 border border-purple-400/30 text-purple-200 text-xs px-3 py-1 rounded-xl font-medium"
                              >
                                <strong>{c.code}</strong> — {c.description}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* S - Subjective */}
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400" /> S - Subjective
                        </h5>
                        <p className="text-white/90 text-sm leading-relaxed">{soapData.subjective}</p>
                      </div>

                      {/* O - Objective */}
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> O - Objective
                        </h5>
                        <p className="text-white/90 text-sm leading-relaxed">{soapData.objective}</p>
                      </div>

                      {/* A - Assessment */}
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> A - Assessment
                        </h5>
                        <p className="text-white/90 text-sm leading-relaxed">{soapData.assessment}</p>
                      </div>

                      {/* P - Plan */}
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-400" /> P - Plan
                        </h5>
                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">{soapData.plan}</p>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Extracted Prescription Draft */}
                  {activeTab === 'prescription' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                          Auto-Extracted Medication Regimen ({soapData.extractedMedicines?.length || 0})
                        </span>
                        {onAutoFillPrescription && (
                          <button
                            onClick={handleTransferToPrescription}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                          >
                            <Send size={14} /> Transfer to Prescription Pad
                          </button>
                        )}
                      </div>

                      {soapData.extractedMedicines?.map((med: any, i: number) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-bold text-base">{med.medicineName}</h4>
                            <span className="text-xs bg-blue-500/20 text-blue-300 font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                              {med.dosage}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-white/70 pt-1">
                            <div>
                              <span className="text-white/40 block">Frequency:</span>
                              <span className="text-white/90 font-medium">{med.frequency}</span>
                            </div>
                            <div>
                              <span className="text-white/40 block">Duration:</span>
                              <span className="text-white/90 font-medium">{med.duration}</span>
                            </div>
                          </div>
                          {med.instructions && (
                            <p className="text-xs text-white/60 pt-1 border-t border-white/5">
                              <span className="text-white/40 font-medium">Instructions: </span>
                              {med.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tab 3: Patient Layman Summary */}
                  {activeTab === 'patientSummary' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                          <Heart size={16} /> Patient-Facing Discharge Synopsis
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
                          {soapData.patientLaymanSummary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: Safety Cautions */}
                  {activeTab === 'safety' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                          <AlertTriangle size={16} /> Clinical Safety Alerts & Contraindication Cues
                        </div>
                        <ul className="space-y-2 text-sm text-white/80 list-disc list-inside">
                          {soapData.safetyAlerts?.map((alert: string, i: number) => (
                            <li key={i}>{alert}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
