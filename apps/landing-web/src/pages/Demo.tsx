import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Stethoscope, Smartphone, Video, FileText } from 'lucide-react';

const roles = [
  { id: 'doctor', label: 'Physician / Clinician', icon: Stethoscope },
  { id: 'hospital', label: 'Hospital / Clinic Admin', icon: Activity },
  { id: 'pharmacy', label: 'Pharmacist', icon: FileText },
  { id: 'patient', label: 'Patient Platform Operator', icon: Smartphone },
];

const features = [
  'End-to-end encrypted WebRTC video consultations',
  'In-session digital prescription issuance',
  'Real-time pharmacy dispensing queue',
  'Role-scoped JWT authentication across all portals',
  'Immutable audit log for every clinical event',
  'Appointment scheduling with conflict detection',
];

export default function Demo() {
  const [selectedRole, setSelectedRole] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white text-text-main font-sans">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-surface-accent">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-text-main" strokeWidth={2} />
            <span className="font-extrabold text-xl tracking-tight text-text-main">MedLink</span>
            <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
            <span className="font-medium text-base text-slate-500">Request a Demo</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/about" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">About</Link>
            <Link to="/architecture" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">Architecture</Link>
            <Link to="/" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">← Home</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left — context */}
            <div className="pt-8 sticky top-28">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-brand-blue text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
                Live Demo
              </div>
              <h1 className="text-4xl font-semibold text-text-main leading-tight mb-5">
                See a full clinical encounter — live
              </h1>
              <p className="text-text-muted leading-relaxed mb-10">
                We'll walk you through a complete end-to-end session: appointment booking, encrypted video consultation, in-session prescription issuance, and real-time pharmacy dispensing — across all three portals simultaneously.
              </p>

              <div className="flex flex-col gap-3 mb-10">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <span className="text-sm text-text-muted">{f}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#f4f7ff] border border-blue-100 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Video className="w-5 h-5 text-brand-blue" />
                  <span className="font-medium text-text-main text-sm">What the demo covers</span>
                </div>
                <ul className="text-sm text-text-muted space-y-2 pl-8 list-disc">
                  <li>Doctor Portal: availability management & consultation UI</li>
                  <li>Patient App: booking flow & video session join</li>
                  <li>Pharmacy Portal: real-time prescription intake & dispensing</li>
                  <li>Backend API: live request/response walkthrough</li>
                </ul>
              </div>
            </div>

            {/* Right — form */}
            <div className="pt-8">
              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-5" />
                  <h2 className="text-2xl font-semibold text-text-main mb-3">Request received</h2>
                  <p className="text-text-muted mb-6 max-w-sm mx-auto">
                    We'll reach out within one business day to schedule your walkthrough session.
                  </p>
                  <Link to="/" className="inline-block bg-brand-blue hover:bg-brand-hover text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-text-main mb-6">Tell us about your setup</h2>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">First Name</label>
                      <input required type="text" placeholder="Aarav"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Last Name</label>
                      <input required type="text" placeholder="Shah"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Work Email</label>
                    <input required type="email" placeholder="aarav@hospital.in"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors" />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Organisation</label>
                    <input required type="text" placeholder="City General Hospital"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors" />
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Your role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map(({ id, label, icon: Icon }) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => setSelectedRole(id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            selectedRole === id
                              ? 'border-brand-blue bg-blue-50 text-brand-blue'
                              : 'border-slate-200 text-text-muted hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">What do you want to see? <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                    <textarea rows={3} placeholder="e.g. prescription workflow, multi-doctor scheduling, pharmacy integration..."
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-colors resize-none" />
                  </div>

                  <button type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-hover text-white py-3 rounded-lg font-medium text-sm transition-colors shadow-sm">
                    Submit Demo Request
                  </button>

                  <p className="text-center text-xs text-slate-400 mt-4">
                    No spam. We'll respond within one business day.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="font-semibold text-text-main">MedLink</span>
            <span>© 2026 MedLink Technologies Inc.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <Link to="/about" className="hover:text-brand-blue transition-colors">About</Link>
            <Link to="/architecture" className="hover:text-brand-blue transition-colors">Architecture</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
