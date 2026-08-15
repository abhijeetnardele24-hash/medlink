import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  AlertTriangle,
  HeartPulse,
  PhoneCall,
  User,
  Bot,
  Stethoscope,
  Calendar,
  CheckCircle,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProbableCondition {
  condition: string;
  likelihood: 'high' | 'moderate' | 'possible';
}

interface TriageResult {
  nextAssistantQuestion: string;
  isAssessmentComplete: boolean;
  emergencyRedFlag: boolean;
  emergencyReason?: string;
  urgencyLevel: number;
  urgencyLabel: string;
  recommendedSpecialty: string;
  probableConditions: ProbableCondition[];
  clinicalIntakeSummary: string;
  suggestedQuickReplies: string[];
}

interface AITriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctorCategory?: (specialty: string) => void;
}

export const AITriageModal: React.FC<AITriageModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctorCategory
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your MedLink AI Clinical Triage Navigator. What symptoms or health concerns are you experiencing today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [triageData, setTriageData] = useState<TriageResult | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([
    'Mild Fever & Sore Throat',
    'Itchy Skin Rash',
    'Acid Reflux & Stomach Discomfort',
    'Headache & Fatigue'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/triage/chat', {
        messages: updatedMessages
      });

      const data: TriageResult = res.data;
      setTriageData(data);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.nextAssistantQuestion }
      ]);

      if (data.suggestedQuickReplies && data.suggestedQuickReplies.length > 0) {
        setQuickReplies(data.suggestedQuickReplies);
      } else {
        setQuickReplies([]);
      }
    } catch (err) {
      console.error('Triage chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I encountered a brief network delay. Based on your symptoms, a standard tele-consultation with our General Physician is recommended.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hello! I am your MedLink AI Clinical Triage Navigator. What symptoms or health concerns are you experiencing today?'
      }
    ]);
    setTriageData(null);
    setQuickReplies([
      'Mild Fever & Sore Throat',
      'Itchy Skin Rash',
      'Acid Reflux & Stomach Discomfort',
      'Headache & Fatigue'
    ]);
  };

  const handleBookSpecialist = () => {
    if (triageData?.recommendedSpecialty && onSelectDoctorCategory) {
      onSelectDoctorCategory(triageData.recommendedSpecialty);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '1.5rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg-main, #0f172a)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 6px 12px rgba(37,99,235,0.3)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  AI Clinical Triage Navigator
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '999px',
                    background: 'rgba(37,99,235,0.15)',
                    color: '#3b82f6',
                    border: '1px solid rgba(37,99,235,0.3)'
                  }}
                >
                  INFERMEDICA ENGINE
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Bayesian symptom assessment & red-flag emergency screening
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleReset}
              title="Reset Triage Chat"
              style={{
                padding: '0.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Interactive Chat Stream */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid var(--border-color)',
              background: 'var(--bg-surface)'
            }}
          >
            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}
                  >
                    {!isUser && (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0
                        }}
                      >
                        <Bot size={16} />
                      </div>
                    )}
                    <div
                      style={{
                        padding: '0.85rem 1.15rem',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isUser ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        color: isUser ? 'white' : 'var(--text-main)',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(37,99,235,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6'
                    }}
                  >
                    <Loader2 size={16} className="spinner" />
                  </div>
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      borderRadius: '18px 18px 18px 4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}
                  >
                    Analyzing clinical risk factors...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {quickReplies.length > 0 && (
              <div
                style={{
                  padding: '0.5rem 1.25rem',
                  display: 'flex',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(qr)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(37,99,235,0.3)',
                      background: 'rgba(37,99,235,0.1)',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              style={{
                padding: '1rem 1.25rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '0.75rem'
              }}
            >
              <input
                type="text"
                placeholder="Describe what you feel (e.g. fever for 2 days with headache)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-main)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn btn-primary"
                style={{
                  borderRadius: '14px',
                  padding: '0 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Right: Live Clinical Diagnosis & Triage Outcome */}
          <div
            style={{
              width: '340px',
              padding: '1.5rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'var(--bg-main)'
            }}
          >
            {/* Emergency Alert Banner */}
            {triageData?.emergencyRedFlag && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#fca5a5'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} color="#ef4444" /> EMERGENCY RED-FLAG
                </div>
                <p style={{ fontSize: '0.8rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                  {triageData.emergencyReason || 'Critical symptoms detected requiring immediate hospital intervention.'}
                </p>
                <a
                  href="tel:108"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontSize: '0.85rem'
                  }}
                >
                  <PhoneCall size={16} /> Call Emergency (108)
                </a>
              </div>
            )}

            {/* Recommended Specialist Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                Recommended Specialist
              </span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} />
                {triageData?.recommendedSpecialty || 'General Physician'}
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Triage Urgency: <strong>{triageData?.urgencyLabel || 'Standard Assessment'}</strong>
              </div>

              <button
                onClick={handleBookSpecialist}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Calendar size={16} /> Book Consultation
              </button>
            </div>

            {/* Probable Clinical Conditions */}
            {triageData?.probableConditions && triageData.probableConditions.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Probable Clinical Syntheses
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {triageData.probableConditions.map((pc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pc.condition}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: pc.likelihood === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                          color: pc.likelihood === 'high' ? '#ef4444' : '#3b82f6'
                        }}
                      >
                        {pc.likelihood.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Intake Brief */}
            {triageData?.clinicalIntakeSummary && (
              <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(59,130,246,0.04)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                  Pre-Consultation Intake Brief
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                  {triageData.clinicalIntakeSummary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
