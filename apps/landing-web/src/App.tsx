import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Video, Shield, Users, Stethoscope, Database, Cloud, Lock, Server, CheckCircle2, FileText, Smartphone, ArrowRight, Zap, RefreshCw, Activity, Store } from 'lucide-react';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
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
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
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
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
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
          <motion.div whileHover={{ color: 'var(--text-main)', y: -1 }} onClick={() => scrollToSection('architecture')} style={{ cursor: 'pointer', transition: 'color 0.2s', color: 'var(--text-main)' }}>Architecture</motion.div>

          {/* Solutions Dropdown */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={() => setActiveDropdown('solutions')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <motion.div whileHover={{ color: 'var(--text-main)', y: -1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}>
              Solutions <ChevronDown size={14} style={{ transform: activeDropdown === 'solutions' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </motion.div>
            
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
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Smartphone size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Patient App</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Self-service booking & video consults.</div>
                        </div>
                      </motion.div>
                    </a>
                    
                    <a href="http://localhost:5174" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Stethoscope size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Doctor Hub</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>WebRTC hub with clinical prescribing.</div>
                        </div>
                      </motion.div>
                    </a>
                  </div>
                  
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                     <a href="http://localhost:5175" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: '1.25rem' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Server size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Admin Console</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Centralized global hospital operations.</div>
                        </div>
                      </motion.div>
                    </a>
                     <a href="http://localhost:5177" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                      <motion.div whileHover={{ x: 4 }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--bg-muted)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}><Store size={16} color="var(--text-main)" /></div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>Pharmacy Portal</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enterprise medicine marketplace.</div>
                        </div>
                      </motion.div>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div whileHover={{ color: 'var(--text-main)', y: -1 }} onClick={() => scrollToSection('workflow')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}>Video Engine</motion.div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="http://localhost:5176" style={{ fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Patient Login</a>
          <a href="http://localhost:5174" className="btn btn-primary" style={{ padding: '8px 16px' }}>Doctor Portal <ArrowRight size={14}/></a>
        </div>
      </nav>

      {/* 3. Clean Polished Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 2rem 10rem', position: 'relative', background: 'var(--bg-base)', overflow: 'hidden' }}>
        {/* Subtle background glow for glassmorphism */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none' }}></div>

        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '1000px' }}
        >
          <motion.div variants={itemVars} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2.5rem', color: 'var(--text-main)', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
            Continuity of care under network failure
          </motion.div>

          <motion.h1 variants={itemVars} className="hero-title" style={{ fontSize: '4rem', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem', fontWeight: 800 }}>
            Adaptive Telemedicine for <br />
            <span style={{ color: '#2563eb' }}>Low-Bandwidth Contexts</span>
          </motion.h1>

          <motion.p variants={itemVars} className="hero-subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '750px', marginBottom: '3rem', lineHeight: 1.6 }}>
            MedLink intelligently degrades from video to audio, secure async chat, and offline-first modes based on real-time network conditions. Includes an integrated, offline-capable pharmacy marketplace built for rural workflows.
          </motion.p>

          <motion.div variants={itemVars} style={{ display: 'flex', gap: '1rem', marginBottom: '5rem' }}>
            <button onClick={() => scrollToSection('workflow')} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.05rem', boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}>
              Explore the Architecture
            </button>
            <a href="http://localhost:5174" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              Doctor Demo
            </a>
          </motion.div>

          {/* Glassmorphic UI Mockup */}
          <motion.div variants={itemVars} style={{ 
            width: '100%', 
            maxWidth: '900px', 
            background: 'rgba(0, 0, 0, 0.6)', 
            backdropFilter: 'blur(24px)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '24px',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Window controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
              <div style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={12} color="#f59e0b" /> Connection: DEGRADED (Switching to Audio)
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', height: '400px' }}>
              {/* Video Area */}
              <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.4) 100%)' }}></div>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Users size={32} color="rgba(255,255,255,0.5)" />
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Patient (Audio Only)</div>
                  <div style={{ fontSize: '0.9rem', color: '#f59e0b', marginTop: '0.5rem' }}>Video disabled to preserve call quality</div>
                </div>
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Server size={14} /> Ping: 420ms
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={14} /> Packet Loss: 8%
                  </div>
                </div>
              </div>
              
              {/* Sidebar: Notes & Chat */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Async Sync Queue */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>OFFLINE SYNC QUEUE</span>
                    <Cloud size={14} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>Prescription Update</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Synced to server ✓</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>Clinical Note</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Pending Sync (Offline) ⏳</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              connecting four separate portals through a centralized API gateway.
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
              { 
                step: 5, title: 'Pharmacy Fulfillment', app: 'Pharmacy Portal', icon: <Store size={24} />, link: "http://localhost:5177",
                desc: 'Digital prescriptions automatically flow into the secure Pharmacy marketplace. Registered pharmacists verify prescriptions, manage inventory, and process orders for patient pickup or delivery.',
                tags: [{i: <Lock size={14}/>, t: 'Rx Verification'}, {i: <CheckCircle2 size={14}/>, t: 'Inventory Sync'}]
              },
            ].map((s, i) => (
              <motion.div 
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
                className="workflow-step"
              >
                <div className="workflow-icon" style={s.highlight ? { background: 'var(--text-main)', color: 'white', borderColor: 'var(--text-main)' } : {}}>
                  {s.icon}
                </div>
                <motion.div 
                  whileHover={{ y: -4, boxShadow: '0 15px 30px -5px rgba(0,0,0,0.1)' }}
                  className="workflow-content" style={s.highlight ? { borderColor: 'var(--text-main)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } : {}}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{s.step}. {s.title}</h3>
                    <a href={s.link} style={{ textDecoration: 'none' }}>
                      <motion.span whileHover={{ scale: 1.05 }} style={{ cursor: 'pointer', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: s.highlight ? 'var(--text-main)' : 'var(--bg-muted)', color: s.highlight ? 'white' : 'var(--text-main)', border: `1px solid ${s.highlight ? 'transparent' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {s.app} <ArrowRight size={12}/>
                      </motion.span>
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
                </motion.div>
              </motion.div>
            ))}

          </div>
        </div>
      </section>

      {/* 5 & 6. Unified Architecture Section */}
      <section id="architecture" style={{ padding: '8rem 4rem', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1.1 }}>Built for massive throughput.</h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
              MedLink operates on a microservices-inspired architecture. A centralized Node.js API gateway handles requests from four distinct React applications, ensuring complete data isolation and strict role-based access control. Video streams flow directly peer-to-peer for maximum performance and HIPAA compliance.
            </p>
          </div>

          <ArchitectureDiagram />

          <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center' }}>
            <a href="http://localhost:5175" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '1.05rem' }}>
              Login to Admin Console <ArrowRight size={18} style={{ marginLeft: '0.5rem' }}/>
            </a>
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
                <li><a href="http://localhost:5177" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Pharmacy Portal</a></li>
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
