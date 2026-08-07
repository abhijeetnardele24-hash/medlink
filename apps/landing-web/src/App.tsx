import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Video, Shield, Users, Stethoscope, Database, Cloud, Lock, Server, CheckCircle2, FileText, Smartphone, ArrowRight, Zap, RefreshCw, Activity, Hexagon } from 'lucide-react';
import './index.css';

const MedLinkLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="36" height="36" rx="10" fill="#111827"/>
    {/* Interlocking modern medical cross / link */}
    <path d="M10 18H14L17 10L23 26L26 18H30" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="28" cy="12" r="3" fill="#10b981" />
  </svg>
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
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      {/* 1. Top Announcement Banner */}
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          background: 'var(--bg-banner)', 
          color: 'var(--text-inverse)', 
          padding: '0.6rem', 
          textAlign: 'center', 
          fontSize: '0.85rem', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
          NEW
        </span>
        MedLink Unified Telemedicine Platform v2.0 is now live for all Enterprise customers.
      </motion.div>

      {/* 2. Crisp Navbar */}
      <nav style={{ padding: '1rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', fontFamily: 'Manrope, sans-serif' }}>
          <MedLinkLogo />
          MEDLINK
        </div>
        
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <div onClick={() => scrollToSection('architecture')} style={{ cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-main)' }}>Architecture</div>

          {/* Solutions Dropdown */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
              Solutions <ChevronDown size={14} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
            
            <AnimatePresence>
              {activeDropdown === 'solutions' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 5, scale: 0.98 }} 
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: '-50%', width: '400px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)', zIndex: 101, marginTop: '1.25rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <a href="http://localhost:5176" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Smartphone size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Patient App</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Self-service booking & video consults.</div>
                        </div>
                      </div>
                    </a>
                    
                    <a href="http://localhost:5174" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Stethoscope size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Doctor Hub</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>WebRTC hub with clinical prescribing.</div>
                        </div>
                      </div>
                    </a>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                     <a href="http://localhost:5175" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Server size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Admin Console</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Centralized global hospital operations.</div>
                        </div>
                      </div>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div onClick={() => scrollToSection('webrtc')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Video Engine</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="http://localhost:5176" style={{ fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Patient Login</a>
          <a href="http://localhost:5174" className="btn btn-primary" style={{ padding: '8px 16px' }}>Doctor Portal <ArrowRight size={14}/></a>
        </div>
      </nav>

      {/* 3. Clean Polished Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '8rem 2rem 10rem', position: 'relative', background: 'var(--bg-base)' }}>
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <motion.div variants={itemVars} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2.5rem', color: 'var(--text-main)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
            WebRTC Engine handles 10k+ concurrent streams
          </motion.div>

          <motion.h1 variants={itemVars} className="hero-title">
            Healthcare routing,<br />engineered for speed.
          </motion.h1>

          <motion.p variants={itemVars} className="hero-subtitle">
            MedLink unifies patient intake, clinical verification, and zero-latency video consults into a single, automated data platform for modern health networks.
          </motion.p>

          <motion.div variants={itemVars} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => scrollToSection('workflow')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              Explore the Workflow
            </button>
            <a href="http://localhost:5175" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              Access Admin Console
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* 4. Polished Technical Workflow Section */}
      <section id="workflow" style={{ padding: '8rem 4rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '6rem' }}
          >
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>The Clinical Workflow</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              How MedLink processes millions of remote encounters with zero friction, 
              connecting three separate portals through a centralized API gateway.
            </p>
          </motion.div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {[
              { 
                step: 1, title: 'Patient Intake & Scheduling', app: 'Patient Portal', icon: <Users size={24} />, link: "http://localhost:5176",
                desc: 'Patients log into a secure, HIPAA-compliant gateway. They browse verified specialists, view real-time availability, and request appointments based on their specific health concern.',
                tags: [{i: <Database size={14}/>, t: 'PostgreSQL Auth'}, {i: <Server size={14}/>, t: 'Node.js REST API'}]
              },
              { 
                step: 2, title: 'Clinical Verification & Triage', app: 'Coordinator Console', icon: <Shield size={24} />, link: "http://localhost:5175",
                desc: 'Hospital administrators and coordinators monitor incoming requests globally. They verify patient records, manage doctor workloads, and ensure compliance before the encounter begins.',
                tags: [{i: <Activity size={14}/>, t: 'Real-time Analytics'}, {i: <Lock size={14}/>, t: 'Role-Based Access'}]
              },
              { 
                step: 3, title: 'WebRTC Video Consultation', app: 'Doctor & Patient', icon: <Video size={24} />, highlight: true, link: "http://localhost:5174",
                desc: 'At the scheduled time, a peer-to-peer, end-to-end encrypted video room is instantiated. Doctors have access to in-call controls, split-screen patient history, and live recording.',
                tags: [{i: <Server size={14}/>, t: 'Socket.io Signaling'}, {i: <Cloud size={14}/>, t: 'E2EE Video Streams'}]
              },
              { 
                step: 4, title: 'Post-Encounter Processing', app: 'Doctor Portal', icon: <FileText size={24} />, link: "http://localhost:5174",
                desc: 'The encounter concludes. The video recording is automatically compressed and uploaded to secure cloud storage. The doctor finalizes clinical notes and issues digital prescriptions.',
                tags: [{i: <Cloud size={14}/>, t: 'Firebase Blob Storage'}, {i: <CheckCircle2 size={14}/>, t: 'Immutable Records'}]
              },
            ].map((s, i) => (
              <motion.div 
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="workflow-step"
              >
                <div className="workflow-icon" style={s.highlight ? { background: 'var(--text-main)', color: 'white', borderColor: 'var(--text-main)' } : {}}>
                  {s.icon}
                </div>
                <div className="workflow-content" style={s.highlight ? { borderColor: 'var(--text-main)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } : {}}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.step}. {s.title}</h3>
                    <a href={s.link} style={{ textDecoration: 'none' }}>
                      <span style={{ cursor: 'pointer', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: s.highlight ? 'var(--text-main)' : 'var(--bg-muted)', color: s.highlight ? 'white' : 'var(--text-main)', border: `1px solid ${s.highlight ? 'transparent' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {s.app} <ArrowRight size={12}/>
                      </span>
                    </a>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{s.desc}</p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {s.tags.map((t, idx) => (
                      <span key={idx} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', background: 'var(--bg-base)', color: 'var(--text-muted)', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border)' }}>
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

      {/* 5. Clean Architecture Graphic Section */}
      <section id="architecture" style={{ padding: '8rem 4rem', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '6rem', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '2rem', lineHeight: 1.1 }}>Built for massive throughput.</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              MedLink operates on a microservices-inspired architecture. A centralized Node.js API gateway handles requests from three distinct React applications, ensuring complete data isolation and strict role-based access control.
            </p>
            
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              {[
                'Three isolated React frontend portals',
                'Centralized PostgreSQL database with Prisma ORM',
                'Real-time socket.io signaling server for WebRTC handshakes',
                'Direct Firebase Storage integration for media blobs'
              ].map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', fontWeight: 500 }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--bg-muted)', color: 'var(--text-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={12} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <a href="http://localhost:5175" className="btn btn-secondary" style={{ width: 'fit-content' }}>Login to Admin Console <ArrowRight size={16}/></a>
          </motion.div>

          {/* Clean Graphic 1 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="dotted-bg" style={{ padding: '4rem', position: 'relative', minHeight: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: '24px' }}
          >
            {/* Top Row: Frontend Portals */}
            <div style={{ display: 'flex', gap: '1.5rem', zIndex: 2, width: '100%', justifyContent: 'center' }}>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Smartphone size={18}/> Patient App</motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Stethoscope size={18}/> Doctor Hub</motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Server size={18}/> Admin Web</motion.div>
            </div>

            {/* Middle: API Gateway */}
            <div style={{ background: 'var(--text-main)', color: 'white', border: 'none', padding: '1.5rem 3rem', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', zIndex: 2, display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
              <Activity size={24} /> Central REST API Gateway
            </div>

            {/* Clean SVG Lines */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} d="M180,180 C180,250 350,250 350,280" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} d="M380,180 L380,280" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4, ease: "easeOut" }} d="M580,180 C580,250 410,250 410,280" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
              
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} d="M380,360 L380,440" fill="none" stroke="#d1d5db" strokeWidth="2" />
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} d="M380,360 C380,410 180,410 180,440" fill="none" stroke="#d1d5db" strokeWidth="2" />
              <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.7, ease: "easeOut" }} d="M380,360 C380,410 580,410 580,440" fill="none" stroke="#d1d5db" strokeWidth="2" />
            </svg>

            {/* Bottom Row: Databases */}
            <div style={{ display: 'flex', gap: '1.5rem', zIndex: 2, width: '100%', justifyContent: 'center' }}>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--text-main)', padding: '1.5rem', borderRadius: '16px', fontWeight: 600, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <Database size={24} /> PostgreSQL
              </motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px', fontWeight: 600, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <RefreshCw size={24} color="#111827" /> WebRTC Signaling
              </motion.div>
              <motion.div whileHover={{ y: -2 }} style={{ background: 'white', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '16px', fontWeight: 600, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Cloud size={24} color="#111827" /> Firebase Storage
              </motion.div>
            </div>

          </motion.div>

        </div>
      </section>

      {/* 6. NEW: Live WebRTC Signaling Diagram Section */}
      <section id="webrtc" style={{ padding: '8rem 4rem', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Zero-Latency Encrypted Video</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto' }}>
              Once a handshake is completed via our Socket.io gateway, video streams flow directly peer-to-peer, bypassing the server entirely for maximum performance and HIPAA compliance.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            
            {/* Diagram Container */}
            <div style={{ width: '100%', maxWidth: '800px', background: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              
              {/* Patient Node */}
              <motion.div initial={{ x: -30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 2 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={32} color="var(--text-main)" />
                </div>
                <div style={{ fontWeight: 700 }}>Patient Browser</div>
              </motion.div>

              {/* Signaling Server (Top) */}
              <motion.div initial={{ y: -30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--text-main)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <Zap size={24} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', background: 'var(--bg-surface)', padding: '0.2rem 0.75rem', borderRadius: '99px', border: '1px solid var(--border)' }}>Socket.io Signaling</div>
              </motion.div>

              {/* Doctor Node */}
              <motion.div initial={{ x: 30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 2 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={32} color="var(--text-main)" />
                </div>
                <div style={{ fontWeight: 700 }}>Doctor Browser</div>
              </motion.div>

              {/* Animated Connection Lines */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                {/* SDP Offer Line (Patient -> Server) */}
                <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 2 }} d="M150,110 C200,60 300,50 380,40" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
                <motion.circle initial={{ pathOffset: 0 }} whileInView={{ offsetDistance: "100%" }} transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 2 }} cx="0" cy="0" r="4" fill="var(--text-muted)" style={{ offsetPath: 'path("M150,110 C200,60 300,50 380,40")' }} />

                {/* SDP Answer Line (Server -> Doctor) */}
                <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: 'loop', repeatDelay: 2 }} d="M420,40 C500,50 600,60 650,110" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* P2P Video Stream Line (Direct) */}
                <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 2 }} d="M160,150 L640,150" fill="none" stroke="var(--accent)" strokeWidth="4" />
                {/* Moving packets on P2P line */}
                <motion.rect initial={{ x: 160 }} whileInView={{ x: 620 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} y="146" width="16" height="8" rx="4" fill="var(--accent)" />
                <motion.rect initial={{ x: 620 }} whileInView={{ x: 160 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} y="146" width="16" height="8" rx="4" fill="#10b981" />
              </svg>

              {/* Direct P2P Label */}
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 2.5 }} style={{ position: 'absolute', top: '165px', left: '50%', transform: 'translateX(-50%)', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem', background: 'white', padding: '0.2rem 0.5rem' }}>
                Encrypted E2E Media Stream (UDP)
              </motion.div>

            </div>

            <div style={{ marginTop: '4rem' }}>
               <a href="http://localhost:5174" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
                Join as a Doctor <ArrowRight size={18}/>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)', color: 'var(--text-main)', padding: '4rem 4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '3rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', fontFamily: 'Manrope, sans-serif', marginBottom: '1rem' }}>
              <MedLinkLogo />
              MEDLINK
            </div>
            <p style={{ color: 'var(--text-muted)', maxWidth: '300px', fontSize: '0.9rem' }}>Enterprise Telemedicine Infrastructure built for the modern health system.</p>
          </div>
          <div style={{ display: 'flex', gap: '5rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Portals</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><a href="http://localhost:5176" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Patient Gateway</a></li>
                <li><a href="http://localhost:5174" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Doctor Hub</a></li>
                <li><a href="http://localhost:5175" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Admin Console</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Company</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Documentation</span></li>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Security Protocol</span></li>
                <li><span style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}>Contact Sales</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span>© 2024 MedLink Enterprise. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{width: 6, height: 6, borderRadius: '50%', background: '#10b981'}}></span> System Status: Operational</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
