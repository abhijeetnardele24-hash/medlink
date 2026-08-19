import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Video, Shield, Users, Stethoscope, Database, Cloud, Lock, Server, CheckCircle2, FileText, Smartphone, ArrowRight, Zap, RefreshCw, Activity, Store, Sparkles, HeartPulse, Stethoscope as StethoscopeIcon } from 'lucide-react';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import './index.css';

const PATIENT_URL = import.meta.env.VITE_PATIENT_URL || 'http://localhost:5176';
const DOCTOR_URL = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:5174';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5175';
const PHARMACY_URL = import.meta.env.VITE_PHARMACY_URL || 'http://localhost:5177';

// New Text-based Luxury Logo
const MedLinkLogo = () => (
  <span className="font-luxury" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.01em' }}>
    MedLink
  </span>
);

function App() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      


      {/* 2. Apple-Style Liquid Glass Navbar */}
      <nav style={{ padding: '1rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <MedLinkLogo />
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          <motion.div whileHover={{ color: 'var(--accent)', opacity: 1 }} onClick={() => scrollToSection('architecture')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Architecture</motion.div>
          <motion.div whileHover={{ color: 'var(--accent)', opacity: 1 }} onClick={() => scrollToSection('capabilities')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Capabilities</motion.div>

          {/* Solutions Dropdown */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <motion.div whileHover={{ color: 'var(--accent)', opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
              Solutions <ChevronDown size={16} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </motion.div>
            
            <AnimatePresence>
              {activeDropdown === 'solutions' && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.98 }} 
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: 'absolute', top: '100%', left: '-50%', width: '420px', background: 'white', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 20px 40px -10px rgba(13, 38, 59, 0.1)', zIndex: 101, marginTop: '1.5rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <a href={PATIENT_URL} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '0.6rem', borderRadius: '12px', color: 'var(--accent)' }}><Smartphone size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Patient App</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 400 }}>Self-service booking & video.</div>
                        </div>
                      </motion.div>
                    </a>
                    
                    <a href={DOCTOR_URL} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '0.6rem', borderRadius: '12px', color: 'var(--accent)' }}><Stethoscope size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Doctor Hub</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 400 }}>WebRTC hub with prescribing.</div>
                        </div>
                      </motion.div>
                    </a>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                     <a href={ADMIN_URL} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: '1.25rem' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '0.6rem', borderRadius: '12px', color: 'var(--accent)' }}><Server size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Admin Console</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Centralized global hospital operations.</div>
                        </div>
                      </motion.div>
                    </a>
                     <a href={PHARMACY_URL} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '0.6rem', borderRadius: '12px', color: 'var(--accent)' }}><Store size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Pharmacy Portal</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Enterprise medicine marketplace.</div>
                        </div>
                      </motion.div>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div whileHover={{ color: 'var(--accent)', opacity: 1 }} onClick={() => scrollToSection('workflow')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Video Engine</motion.div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href={PATIENT_URL} className="btn-text">Patient Login</a>
          <a href={DOCTOR_URL} className="btn btn-primary">Doctor Portal</a>
        </div>
      </nav>

      {/* 3. Expanded Premium Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10rem 2rem 14rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #ffffff 0%, #F4F7FB 100%)' }}>
        
        {/* Modern Ambient Glow Backgrounds */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '60%', background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1100px' }}
        >
          <motion.h1 variants={itemVars} className="hero-title" style={{ maxWidth: '900px', fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', color: '#0f172a' }}>
            Healthcare, <span className="text-gradient">unified.</span>
          </motion.h1>

          <motion.p variants={itemVars} className="hero-subtitle" style={{ maxWidth: '750px', fontSize: '1.25rem', color: '#475569', marginTop: '1rem', marginBottom: '3.5rem' }}>
            Experience resilient, enterprise-grade healthcare delivery. Featuring real-time video degradation and offline sync, MedLink connects patients and doctors across the globe seamlessly.
          </motion.p>

          <motion.div variants={itemVars} style={{ display: 'flex', gap: '1.25rem', marginBottom: '6rem', alignItems: 'center' }}>
            <button onClick={() => scrollToSection('architecture')} className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.1)' }}>
              Explore the Architecture
            </button>
            <a href={DOCTOR_URL} className="btn" style={{ padding: '16px 40px', fontSize: '1.1rem', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              Doctor Demo <ArrowRight size={18} />
            </a>
          </motion.div>

          {/* Trust Indicators with modern style */}
          <motion.div variants={itemVars} style={{ display: 'flex', gap: '4rem', opacity: 0.7, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', color: '#334155' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem' }}><Shield size={22} style={{ color: '#2563eb' }}/> HIPAA Compliant</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem' }}><Lock size={22} style={{ color: '#2563eb' }}/> SOC-2 Certified</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '1rem' }}><Activity size={22} style={{ color: '#10b981' }}/> 99.99% Uptime</div>
          </motion.div>

        </motion.div>
      </main>

      {/* NEW SECTION: Core Capabilities (Grid) */}
      <section id="capabilities" style={{ padding: '8rem 4rem', background: 'var(--bg-base)', position: 'relative' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 className="font-luxury" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Core Capabilities</h2>
              <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto' }}>
                Engineered for scale and reliability, MedLink provides the essential building blocks for modern healthcare delivery systems.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
              <div className="feature-card">
                <div className="feature-icon-wrapper"><Video size={32} /></div>
                <h3 className="font-luxury" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Resilient WebRTC</h3>
                <p style={{ color: 'var(--text-muted)' }}>Adaptive bitrate streaming ensures crystal clear consultations even on 3G mobile networks. Auto-reconnects on drop.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper"><Store size={32} /></div>
                <h3 className="font-luxury" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Integrated E-Pharmacy</h3>
                <p style={{ color: 'var(--text-muted)' }}>Digital prescriptions flow instantly to the pharmacy portal. Live inventory sync prevents prescribing out-of-stock medicine.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper"><Activity size={32} /></div>
                <h3 className="font-luxury" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Clinical Triage</h3>
                <p style={{ color: 'var(--text-muted)' }}>Advanced routing algorithms match patients with the right specialists based on symptoms, availability, and specialty.</p>
              </div>
            </div>
         </div>
      </section>

      {/* 4. Polished Technical Workflow Section */}
      <section id="workflow" style={{ padding: '8rem 4rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', marginBottom: '7rem' }}
          >
            <h2 className="font-luxury" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>The Clinical Workflow</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              How MedLink processes millions of remote encounters with zero friction, 
              connecting four separate portals through a centralized API gateway.
            </p>
          </motion.div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {[
              { 
                step: 1, title: 'Patient Intake & Scheduling', app: 'Patient Portal', icon: <Users size={28} />, link: PATIENT_URL,
                desc: 'Patients log into a secure, HIPAA-compliant gateway. They browse verified specialists, view real-time availability, and request appointments based on their specific health concern.',
                tags: [{i: <Database size={16}/>, t: 'PostgreSQL Auth'}, {i: <Server size={16}/>, t: 'Node.js REST API'}]
              },
              { 
                step: 2, title: 'Clinical Verification & Triage', app: 'Coordinator Console', icon: <Shield size={28} />, link: ADMIN_URL,
                desc: 'Hospital administrators and coordinators monitor incoming requests globally. They verify patient records, manage doctor workloads, and ensure compliance before the encounter begins.',
                tags: [{i: <Activity size={16}/>, t: 'Real-time Analytics'}, {i: <Lock size={16}/>, t: 'Role-Based Access'}]
              },
              { 
                step: 3, title: 'WebRTC Video Consultation', app: 'Doctor & Patient', icon: <Video size={28} />, highlight: true, link: DOCTOR_URL,
                desc: 'At the scheduled time, a peer-to-peer, end-to-end encrypted video room is instantiated. Doctors have access to in-call controls, split-screen patient history, and live recording.',
                tags: [{i: <Server size={16}/>, t: 'Socket.io Signaling'}, {i: <Cloud size={16}/>, t: 'E2EE Video Streams'}]
              },
              { 
                step: 4, title: 'Post-Encounter Processing', app: 'Doctor Portal', icon: <FileText size={28} />, link: DOCTOR_URL,
                desc: 'The encounter concludes. The video recording is automatically compressed and uploaded to secure cloud storage. The doctor finalizes clinical notes and issues digital prescriptions.',
                tags: [{i: <Cloud size={16}/>, t: 'Firebase Blob Storage'}, {i: <CheckCircle2 size={16}/>, t: 'Immutable Records'}]
              },
              { 
                step: 5, title: 'Pharmacy Fulfillment', app: 'Pharmacy Portal', icon: <Store size={28} />, link: PHARMACY_URL,
                desc: 'Digital prescriptions automatically flow into the secure Pharmacy marketplace. Registered pharmacists verify prescriptions, manage inventory, and process orders for patient pickup or delivery.',
                tags: [{i: <Lock size={16}/>, t: 'Rx Verification'}, {i: <CheckCircle2 size={16}/>, t: 'Inventory Sync'}]
              },
            ].map((s, i) => (
              <motion.div 
                key={s.step}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                className="workflow-step"
              >
                <div className="workflow-icon" style={s.highlight ? { background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' } : {}}>
                  {s.icon}
                </div>
                <div className="workflow-content" style={s.highlight ? { borderColor: 'var(--accent)', boxShadow: '0 10px 30px rgba(0, 147, 167, 0.1)' } : {}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <h3 className="font-luxury" style={{ fontSize: '1.85rem' }}>{s.step}. {s.title}</h3>
                    <a href={s.link} style={{ textDecoration: 'none' }}>
                      <motion.span whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, background: s.highlight ? 'var(--accent)' : 'var(--accent-light)', color: s.highlight ? 'white' : 'var(--accent)', border: `1px solid ${s.highlight ? 'transparent' : 'var(--accent-light)'}`, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {s.app} <ArrowRight size={14}/>
                      </motion.span>
                    </a>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.7 }}>{s.desc}</p>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {s.tags.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--bg-base)', color: 'var(--text-muted)', borderRadius: '99px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
                        {t.i} {t.t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* NEW SECTION: Trust & Security Banner */}
      <section className="trust-banner">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <Shield size={64} style={{ margin: '0 auto 2rem', opacity: 0.9, color: 'var(--accent)' }} />
          <h2 className="font-luxury" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', color: 'white' }}>Enterprise-Grade Security</h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            Patient data privacy is our absolute priority. MedLink implements AES-256 encryption at rest and TLS 1.3 in transit, fully complying with global healthcare regulations including HIPAA and GDPR.
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 2rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>HIPAA</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Compliant</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 2rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>ISO 27001</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Certified</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 2rem', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>End-to-End</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Encryption</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 & 6. Unified Architecture Section */}
      <section id="architecture" style={{ padding: '8rem 4rem', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 className="font-luxury" style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>Built for massive throughput.</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
              MedLink operates on a microservices-inspired architecture. A centralized Node.js API gateway handles requests from four distinct React applications, ensuring complete data isolation and strict role-based access control. Video streams flow directly peer-to-peer for maximum performance.
            </p>
          </div>

          <ArchitectureDiagram />

          <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center' }}>
            <a href={ADMIN_URL} className="btn btn-secondary" style={{ padding: '18px 40px', fontSize: '1.1rem' }}>
              Login to Admin Console <ArrowRight size={18} style={{ marginLeft: '0.5rem' }}/>
            </a>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', color: 'var(--text-main)', padding: '6rem 4rem 3rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '4rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.2rem' }}>
              <MedLinkLogo />
            </div>
            <p style={{ color: 'var(--text-muted)', maxWidth: '350px', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Enterprise Telemedicine Infrastructure built for the modern health system.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6rem' }}>
            <div>
              <h4 className="font-luxury" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Portals</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><a href={PATIENT_URL} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Patient Gateway</a></li>
                <li><a href={DOCTOR_URL} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Doctor Hub</a></li>
                <li><a href={ADMIN_URL} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Admin Console</a></li>
                <li><a href={PHARMACY_URL} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Pharmacy Portal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-luxury" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Documentation</span></li>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Security Protocol</span></li>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', transition: 'color 0.2s' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--accent)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Contact Sales</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          <span>© 2024 MedLink Enterprise. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--success)'}}></span> System Status: Operational
          </span>
        </div>
      </footer>

    </div>
  );
}

export default App;
