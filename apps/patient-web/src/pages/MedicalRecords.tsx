import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  FileText,
  Download,
  Calendar,
  Stethoscope,
  Activity,
  Upload,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  TrendingUp,
  HeartPulse,
  Info
} from 'lucide-react';

interface Prescription {
  id: string;
  issuedAt: string;
  doctorName: string;
  doctorSpeciality: string;
}

interface Biomarker {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  clinicalMeaning: string;
}

interface LabAnalysisResult {
  testTitle: string;
  testCategory: string;
  testDate: string;
  overallHealthSummary: string;
  overallRiskLevel: 'optimal' | 'moderate' | 'high_attention';
  biomarkers: Biomarker[];
  clinicalRecommendations: string[];
  suggestedQuestionsForDoctor: string[];
}

export const MedicalRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'labAnalyzer'>('prescriptions');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Lab Analyzer State
  const [reportInput, setReportInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labResult, setLabResult] = useState<LabAnalysisResult | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get('/prescriptions/me');
        setPrescriptions(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch medical records', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const res = await api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription-${id.substring(0, 8)}.html`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to download prescription', err);
    }
  };

  const handleAnalyzeReport = async (textToAnalyze?: string) => {
    const text = textToAnalyze || reportInput;
    if (!text.trim()) {
      alert('Please enter or paste your lab report text first.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await api.post('/ai/lab-report/analyze', { reportText: text });
      setLabResult(res.data);
    } catch (err) {
      console.error('Failed to analyze lab report', err);
      alert('Failed to analyze lab report with AI. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleReport = (type: 'lipid' | 'cbc') => {
    let sample = '';
    if (type === 'lipid') {
      sample = `COMPREHENSIVE METABOLIC & LIPID PROFILE
Date: ${new Date().toISOString().split('T')[0]}
Patient: John Doe, Age 42, Male

TEST RESULTS:
Fasting Blood Glucose: 115 mg/dL (Ref: 70 - 99 mg/dL) [HIGH]
Total Cholesterol: 224 mg/dL (Ref: < 200 mg/dL) [HIGH]
Triglycerides: 168 mg/dL (Ref: < 150 mg/dL) [HIGH]
HDL Cholesterol: 48 mg/dL (Ref: > 40 mg/dL) [NORMAL]
LDL Cholesterol: 142 mg/dL (Ref: < 100 mg/dL) [HIGH]
Serum Creatinine: 0.95 mg/dL (Ref: 0.7 - 1.3 mg/dL) [NORMAL]
TSH (Thyroid): 2.1 uIU/mL (Ref: 0.4 - 4.2 uIU/mL) [NORMAL]`;
    } else {
      sample = `COMPLETE BLOOD COUNT (CBC) & INFLAMMATORY PANEL
Date: ${new Date().toISOString().split('T')[0]}
Patient: John Doe, Age 42

TEST RESULTS:
Hemoglobin (Hb): 14.2 g/dL (Ref: 13.0 - 17.0 g/dL) [NORMAL]
Total WBC Count: 7,200 /uL (Ref: 4,000 - 11,000 /uL) [NORMAL]
Platelet Count: 245,000 /uL (Ref: 150,000 - 450,000 /uL) [NORMAL]
HbA1c (Glycated Hemoglobin): 5.8 % (Ref: < 5.7 % Normal, 5.7 - 6.4 % Prediabetes) [ELEVATED]
Serum Uric Acid: 5.4 mg/dL (Ref: 3.5 - 7.2 mg/dL) [NORMAL]`;
    }
    setReportInput(sample);
    handleAnalyzeReport(sample);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '2.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Health Records & Diagnostics</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Access your clinical prescriptions and smart AI biomarker analyses</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('prescriptions')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeTab === 'prescriptions' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'prescriptions' ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} /> Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('labAnalyzer')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: activeTab === 'labAnalyzer' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'labAnalyzer' ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={16} /> Lab Report Analyzer
          </button>
        </div>
      </div>

      {/* Tab 1: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div>
          {prescriptions.length === 0 ? (
            <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.15 }} />
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>No medical records yet</h3>
              <p>Your prescriptions will appear here after your consultations.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {prescriptions.map(rx => (
                <div key={rx.id} className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(66,63,222,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Stethoscope size={22} color="var(--accent)" />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', margin: 0 }}>Dr. {rx.doctorName}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>{rx.doctorSpeciality}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <Calendar size={16} /> 
                      {new Date(rx.issuedAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      <FileText size={16} /> 
                      Rx ID: {rx.id.substring(0, 8).toUpperCase()}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDownload(rx.id)} 
                    className="btn btn-secondary" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem' }}
                  >
                    <Download size={16} /> Download Official PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Smart Lab Report AI Analyzer */}
      {activeTab === 'labAnalyzer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Input Panel */}
          <div className="glass-panel" style={{ padding: '2rem', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} color="var(--accent)" /> Lab Report Scanner
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  Paste raw laboratory results or test with our clinically validated sample reports below.
                </p>
              </div>

              {/* Sample loader buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => loadSampleReport('lipid')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                >
                  ⚡ Sample Lipid & Sugar Panel
                </button>
                <button
                  onClick={() => loadSampleReport('cbc')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                >
                  ⚡ Sample CBC & HbA1c Panel
                </button>
              </div>
            </div>

            <textarea
              value={reportInput}
              onChange={(e) => setReportInput(e.target.value)}
              placeholder="Paste your lab test findings here (e.g. Fasting Glucose: 110 mg/dL, Total Cholesterol: 215 mg/dL, Hemoglobin: 13.5 g/dL)..."
              style={{
                width: '100%',
                minHeight: '130px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '1rem',
                fontFamily: 'monospace'
              }}
            />

            <button
              onClick={() => handleAnalyzeReport()}
              disabled={isAnalyzing || !reportInput.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.85rem 1.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--accent)'
              }}
            >
              {isAnalyzing ? <Loader2 size={18} className="spinner" /> : <Activity size={18} />}
              <span>{isAnalyzing ? 'Extracting Biomarkers...' : 'Analyze Lab Report'}</span>
            </button>
          </div>

          {/* Analysis Results Display */}
          {labResult && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Health Synopsis Banner */}
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  borderLeft: `6px solid ${
                    labResult.overallRiskLevel === 'optimal'
                      ? '#10b981'
                      : labResult.overallRiskLevel === 'moderate'
                      ? '#f59e0b'
                      : '#ef4444'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{labResult.testTitle}</h2>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Category: <strong>{labResult.testCategory}</strong> · Date: {labResult.testDate}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background:
                        labResult.overallRiskLevel === 'optimal'
                          ? 'rgba(16,185,129,0.15)'
                          : labResult.overallRiskLevel === 'moderate'
                          ? 'rgba(245,158,11,0.15)'
                          : 'rgba(239,68,68,0.15)',
                      color:
                        labResult.overallRiskLevel === 'optimal'
                          ? '#10b981'
                          : labResult.overallRiskLevel === 'moderate'
                          ? '#f59e0b'
                          : '#ef4444'
                    }}
                  >
                    {labResult.overallRiskLevel.toUpperCase().replace('_', ' ')}
                  </span>
                </div>

                <p style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.6', margin: 0 }}>
                  {labResult.overallHealthSummary}
                </p>
              </div>

              {/* Biomarkers Breakdown Grid */}
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} color="var(--accent)" /> Detailed Biomarker Breakdown ({labResult.biomarkers.length})
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {labResult.biomarkers.map((b, i) => {
                    const isNormal = b.status === 'normal';
                    const isHigh = b.status === 'high' || b.status === 'critical';
                    const color = isNormal ? '#10b981' : isHigh ? '#ef4444' : '#f59e0b';
                    const bg = isNormal ? 'rgba(16,185,129,0.08)' : isHigh ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';

                    return (
                      <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{b.name}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: bg, color }}>
                            {b.status.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color }}>{b.value}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.unit}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            Ref: <strong>{b.referenceRange}</strong>
                          </span>
                        </div>

                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0, marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                          <Info size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                          {b.clinicalMeaning}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations & Questions to ask doctor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <h4 style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Lifestyle & Clinical Next Steps
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {labResult.clinicalRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <h4 style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HelpCircle size={18} /> Questions to Discuss with Your Doctor
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    {labResult.suggestedQuestionsForDoctor.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
