import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Video, FileText, Stethoscope, Smartphone, ChevronRight, Clock, Users, Lock } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white text-text-main font-sans">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-surface-accent">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-text-main" strokeWidth={2} />
            <span className="font-extrabold text-xl tracking-tight text-text-main">MedLink</span>
            <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
            <span className="font-medium text-base text-slate-500">Enterprise</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">← Back to Home</Link>
            <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="bg-brand-blue hover:bg-brand-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Doctor Portal
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-[#f4f7ff] border-b border-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-brand-blue text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            About MedLink
          </div>
          <h1 className="text-5xl font-semibold text-text-main leading-tight mb-6 tracking-tight">
            A clinical telemedicine platform<br/>built for the entire care chain
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
            MedLink is a vertically integrated telehealth system that connects patients, physicians, and pharmacists through role-specific portals — unified under a single backend with end-to-end encrypted communication and a tamper-evident audit trail on every clinical event.
          </p>
        </div>
      </section>

      {/* What MedLink does */}
      <section className="py-20 px-6 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-text-main mb-4">How the platform works</h2>
          <p className="text-text-muted mb-14 text-lg max-w-2xl">
            Every clinical interaction on MedLink follows a structured encounter lifecycle. Each step is executed within its own role-scoped portal and persisted to a shared audit record.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">1. Appointment Scheduling</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                The patient selects a time slot from a physician's published availability. The scheduling engine enforces conflict detection and dispatches confirmation events to both parties.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">2. Video Consultation</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Consultation rooms are provisioned on-demand via WebRTC peer-to-peer sessions. Media traversal uses a STUN/TURN relay layer with adaptive bitrate negotiation for variable network conditions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">3. Digital Prescription</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Physicians issue digitally authenticated prescriptions from within the active session. Each prescription carries a physician identity token and is routed to the patient record and pharmacy queue simultaneously.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">4. Pharmacy Dispensing</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                The Pharmacy Portal receives the prescription in real time, the pharmacist reviews and processes the dispensing request, and the patient's prescription status updates across all portals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform portals */}
      <section className="py-20 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-text-main mb-4">Platform portals</h2>
          <p className="text-text-muted mb-12 text-lg max-w-2xl">
            Each portal is scoped to a specific clinical role. Patient health records and prescription data are never exposed across role boundaries without explicit authorization.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <a href="http://localhost:5174" target="_blank" rel="noreferrer"
              className="group bg-white border border-slate-200 rounded-xl p-7 hover:shadow-lg hover:border-brand-blue transition-all flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Doctor Portal</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Manage your appointment schedule, conduct encrypted video consultations, issue digital prescriptions, and access full patient encounter history — from one clinical dashboard.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap mt-auto pt-2">
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Consultations</span>
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Prescriptions</span>
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Availability</span>
              </div>
            </a>

            <a href="http://localhost:5175" target="_blank" rel="noreferrer"
              className="group bg-white border border-slate-200 rounded-xl p-7 hover:shadow-lg hover:border-brand-blue transition-all flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
                  <Smartphone className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Patient App</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Search and book appointments with verified doctors, join scheduled video consultations, view issued prescriptions, and track your complete care timeline — from a mobile-first interface.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap mt-auto pt-2">
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Booking</span>
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Video Visits</span>
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Records</span>
              </div>
            </a>

            <a href="http://localhost:5176" target="_blank" rel="noreferrer"
              className="group bg-white border border-slate-200 rounded-xl p-7 hover:shadow-lg hover:border-brand-blue transition-all flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Pharmacy Portal</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Receive digital prescriptions from verified physicians in real time, manage your dispensing queue, maintain live inventory records, and confirm fulfillment back to the prescribing doctor.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap mt-auto pt-2">
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Dispensing Queue</span>
                <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-2 py-1 rounded font-medium">Inventory</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 px-6 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-text-main mb-5">Security & data boundaries</h2>
              <p className="text-text-muted leading-relaxed mb-8">
                MedLink enforces strict role-based access control at the API layer. No portal can read data outside its clinical scope without an explicit authorization grant bound to the encounter record.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Lock, text: 'AES-256 encryption for all media streams and data at rest' },
                  { icon: Shield, text: 'Role-scoped JWT tokens — doctor, patient, pharmacist contexts are never interchangeable' },
                  { icon: FileText, text: 'Immutable audit log on every encounter event: session join, prescription write, status transition' },
                  { icon: Users, text: 'Patient PHI never exposed across portal boundaries without explicit authorization' },
                ].map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-text-muted leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <div className="text-slate-400 text-xs font-mono mb-5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                encounter_lifecycle.json
              </div>
              <pre className="text-xs font-mono leading-relaxed text-slate-300 overflow-x-auto">
{`{
  "encounterId": "enc_9f2a1c",
  "status": "completed",
  "participants": {
    "doctor": { "role": "physician", "verified": true },
    "patient": { "role": "patient", "consent": true }
  },
  "events": [
    { "type": "session_joined", "ts": "2026-09-18T14:02:11Z" },
    { "type": "prescription_issued", "ts": "2026-09-18T14:18:44Z",
      "prescriptionId": "rx_7c3b9a",
      "routedTo": "pharm_portal" },
    { "type": "session_ended", "ts": "2026-09-18T14:22:01Z" }
  ],
  "auditSigned": true
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="font-semibold text-text-main">MedLink</span>
            <span>© 2026 MedLink Technologies Inc.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-brand-blue transition-colors">Home</Link>
            <a href="#" className="hover:text-brand-blue transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
