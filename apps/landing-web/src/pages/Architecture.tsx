import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Server, Database, Shield, Video, FileText, Layers, Globe, Lock, ChevronRight, Cpu, Wifi } from 'lucide-react';

const techStack = [
  { label: 'Frontend', value: 'React 19 + TypeScript + Vite', icon: Layers },
  { label: 'Styling', value: 'Tailwind CSS v4', icon: Layers },
  { label: 'Backend API', value: 'Node.js + Express + REST', icon: Server },
  { label: 'Real-Time', value: 'WebSocket (socket.io)', icon: Wifi },
  { label: 'Database', value: 'PostgreSQL via Prisma ORM', icon: Database },
  { label: 'Video', value: 'WebRTC + STUN/TURN Relay', icon: Video },
  { label: 'Auth', value: 'JWT (role-scoped tokens)', icon: Lock },
  { label: 'Deployment', value: 'Vite dev server (multi-port)', icon: Globe },
];

const dataFlow = [
  {
    step: '01',
    title: 'Patient books an appointment',
    description: 'The Patient App sends a POST /appointments request (JWT-authenticated) to the API server. The scheduling engine checks the physician\'s availability calendar, enforces conflict detection, and persists the appointment record to PostgreSQL. A WebSocket event is emitted to the Doctor Portal notifying of the new booking.',
  },
  {
    step: '02',
    title: 'Doctor confirms and opens a consultation room',
    description: 'The Doctor Portal receives the real-time notification and confirms the appointment. At session start time, the backend provisions a WebRTC session: it generates a room token and returns STUN/TURN server credentials to both the doctor and the patient. The peers use ICE candidate exchange to establish a direct or relayed encrypted media channel.',
  },
  {
    step: '03',
    title: 'Video consultation over WebRTC',
    description: 'Media is transmitted peer-to-peer where NAT traversal permits, or through the TURN relay server as fallback. All media is AES-256 encrypted in transit via DTLS/SRTP — the backend never touches the media stream. Both clients communicate diagnostic notes and in-session chat over the existing WebSocket connection.',
  },
  {
    step: '04',
    title: 'Physician issues a digital prescription',
    description: 'From within the session, the doctor submits a prescription via POST /prescriptions. The API server validates the physician\'s role token, generates the prescription record with a physician identity hash, and persists it to PostgreSQL. The record is pushed in real time to the Pharmacy Portal\'s prescription queue via WebSocket.',
  },
  {
    step: '05',
    title: 'Pharmacy receives and processes dispensing',
    description: 'The Pharmacy Portal displays the incoming prescription. The pharmacist reviews, marks it as dispensed via PATCH /prescriptions/:id/status, and the status change propagates back to the patient\'s medical record and the doctor\'s encounter log — completing the audit trail for that encounter.',
  },
];

export default function Architecture() {
  return (
    <div className="min-h-screen bg-white text-text-main font-sans">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-surface-accent">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-text-main" strokeWidth={2} />
            <span className="font-extrabold text-xl tracking-tight text-text-main">MedLink</span>
            <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
            <span className="font-medium text-base text-slate-500">Architecture</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link to="/about" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">About</Link>
            <Link to="/" className="text-sm font-medium text-text-muted hover:text-brand-blue transition-colors">← Home</Link>
            <Link to="/demo" className="bg-brand-blue hover:bg-brand-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              Request a Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 bg-[#f4f7ff] border-b border-blue-100">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-brand-blue text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            System Architecture
          </div>
          <h1 className="text-5xl font-semibold text-text-main leading-tight mb-5 tracking-tight">
            How MedLink is built
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            A multi-portal clinical telemedicine system built on a shared REST + WebSocket API backend, with WebRTC media relay for encrypted video consultations and PostgreSQL for all clinical data persistence.
          </p>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-20 px-6 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-text-main mb-3">System overview</h2>
            <p className="text-text-muted max-w-2xl">
              Three role-scoped frontend portals communicate with a single API server over HTTPS REST and WebSocket. The API server manages all clinical data and coordinates WebRTC session establishment for video consultations.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <img
              src="/medlink/architecture-diagram.jpg"
              alt="MedLink system architecture diagram showing three portals connecting to the API gateway, PostgreSQL database, WebRTC STUN/TURN relay, and notification service"
              className="w-full object-contain"
            />
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { color: 'bg-blue-500', label: 'Frontend Portals (3 React apps)' },
              { color: 'bg-blue-700', label: 'API Gateway (Express + JWT)' },
              { color: 'bg-slate-500', label: 'Data & Services layer' },
              { color: 'bg-dashed border-2 border-slate-400', label: 'WebRTC media path (encrypted)' },
            ].map(({ color, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
                <div className={`w-4 h-4 rounded ${color} shrink-0`}></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-text-main mb-3">Technology stack</h2>
          <p className="text-text-muted mb-12">Every component in the stack chosen for its role in a real-time clinical system.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-sm font-medium text-text-main leading-snug">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="py-20 px-6 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-semibold text-text-main mb-3">End-to-end data flow</h2>
          <p className="text-text-muted mb-14 max-w-2xl">
            A complete clinical encounter from appointment booking to prescription dispensing — showing exactly which system handles each transition.
          </p>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-blue-100"></div>
            <div className="flex flex-col gap-0">
              {dataFlow.map(({ step, title, description }, i) => (
                <div key={step} className="relative pl-20 pb-12">
                  <div className="absolute left-0 top-0 w-16 h-16 rounded-full bg-brand-blue text-white flex items-center justify-center font-mono font-bold text-lg shadow-md shadow-brand-blue/20">
                    {step}
                  </div>
                  <h3 className="font-semibold text-xl text-text-main mb-3 pt-3">{title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* API surface callout */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-white mb-3">Key API endpoints</h2>
          <p className="text-slate-400 mb-10">All routes are authenticated with role-scoped JWTs. Role mismatch returns 403.</p>
          <div className="grid md:grid-cols-2 gap-3 font-mono text-sm">
            {[
              { method: 'POST', route: '/api/appointments', desc: 'Book a new appointment slot' },
              { method: 'GET', route: '/api/appointments/:id', desc: 'Fetch encounter details' },
              { method: 'POST', route: '/api/prescriptions', desc: 'Issue a digital prescription' },
              { method: 'PATCH', route: '/api/prescriptions/:id/status', desc: 'Update dispensing status' },
              { method: 'GET', route: '/api/doctors/availability', desc: 'Fetch available time slots' },
              { method: 'POST', route: '/api/auth/login', desc: 'Authenticate and receive JWT' },
              { method: 'WS', route: '/socket', desc: 'Real-time event bus (all portals)' },
              { method: 'GET', route: '/api/patients/:id/records', desc: 'Patient encounter history' },
            ].map(({ method, route, desc }) => (
              <div key={route} className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${
                  method === 'POST' ? 'bg-green-900 text-green-400' :
                  method === 'GET' ? 'bg-blue-900 text-blue-400' :
                  method === 'PATCH' ? 'bg-yellow-900 text-yellow-400' :
                  'bg-purple-900 text-purple-400'
                }`}>{method}</span>
                <div>
                  <div className="text-white">{route}</div>
                  <div className="text-slate-500 text-xs mt-0.5 font-sans">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-semibold text-text-main mb-2">Want a walkthrough?</h3>
            <p className="text-text-muted">We'll walk you through the full clinical encounter flow on a live environment.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/demo" className="bg-brand-blue hover:bg-brand-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm">
              Request a Demo
            </Link>
            <Link to="/about" className="px-5 py-2.5 rounded-md text-sm font-medium bg-slate-100 hover:bg-slate-200 text-text-main transition-colors border border-slate-200">
              About MedLink
            </Link>
          </div>
        </div>
      </section>

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
          </div>
        </div>
      </footer>
    </div>
  );
}
