import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Activity, Hexagon, ChevronDown, Video, Shield, Calendar, Users, Stethoscope } from 'lucide-react';
import './index.css';

function App() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      {/* 1. Top Announcement Banner */}
      <div style={{ 
        background: 'var(--bg-banner)', 
        color: 'white', 
        padding: '0.75rem', 
        textAlign: 'center', 
        fontSize: '0.875rem', 
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}>
        <Activity size={16} color="#10b981" />
        MedLink WebRTC Telemedicine Platform — <span style={{ color: '#a5b4fc' }}>Now in Beta v1.0</span>
      </div>

      {/* 2. Navbar with Functional Mega Menus */}
      <nav style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', background: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.04em', fontFamily: 'Manrope, sans-serif' }}>
          <Activity color="var(--accent)" />
          MEDLINK
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
          
          {/* For Patients Dropdown */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={() => setActiveDropdown('patients')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            For Patients <ChevronDown size={14} style={{ transform: activeDropdown === 'patients' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            
            <AnimatePresence>
              {activeDropdown === 'patients' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: '-50%', width: '300px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 101, marginTop: '1.5rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-lavender)', padding: '0.5rem', borderRadius: '8px' }}><Video size={20} color="var(--accent)" /></div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>HD Video Consults</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Connect with doctors seamlessly.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-lavender)', padding: '0.5rem', borderRadius: '8px' }}><Calendar size={20} color="var(--accent)" /></div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Instant Booking</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Schedule appointments 24/7.</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <a href="http://localhost:5176" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Access Patient Portal <ArrowRight size={14} /></a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* For Doctors Dropdown */}
          <div 
            style={{ position: 'relative', cursor: 'pointer', height: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={() => setActiveDropdown('doctors')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            For Doctors <ChevronDown size={14} style={{ transform: activeDropdown === 'doctors' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            
            <AnimatePresence>
              {activeDropdown === 'doctors' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: '-50%', width: '300px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', zIndex: 101, marginTop: '1.5rem' }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-lavender)', padding: '0.5rem', borderRadius: '8px' }}><Stethoscope size={20} color="var(--accent)" /></div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Clinical Dashboard</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Manage your entire patient roster.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ background: 'var(--bg-lavender)', padding: '0.5rem', borderRadius: '8px' }}><Users size={20} color="var(--accent)" /></div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>E-Prescriptions</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>Issue secure, immutable scripts.</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <a href="http://localhost:5174" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Access Doctor Portal <ArrowRight size={14} /></a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ cursor: 'pointer' }}>For Coordinators</div>
          <div style={{ cursor: 'pointer' }}>Security</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontWeight: 600 }}>
          <a href="http://localhost:5176" style={{ textDecoration: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}>Patient Login</a>
          <a href="http://localhost:5174" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Doctor Login &rarr;</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 1rem 4rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '99px', border: '1px solid var(--border)', fontSize: '0.875rem', marginBottom: '2rem' }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          Platform is live and operational
        </motion.div>

        <motion.h1 
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Healthcare, <br /> Engineered for speed.
        </motion.h1>

        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          MedLink unifies all aspects of telemedicine performance management in a singular data platform.
        </motion.p>
      </main>

      {/* 3. Product Pillars Section */}
      <section style={{ padding: '0 3rem 6rem', position: 'relative', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* Background Squiggly Line SVG */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '200px', zIndex: -1, transform: 'translateY(-50%)', overflow: 'hidden', opacity: 0.4 }}>
          <svg width="100%" height="200" preserveAspectRatio="none">
            <path d="M-50,100 C150,0 300,200 500,100 C700,0 850,200 1050,100 C1250,0 1400,200 1600,100" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="20" cy="100" r="4" fill="white" stroke="var(--accent)" strokeWidth="2" />
            <circle cx="1380" cy="100" r="4" fill="white" stroke="var(--accent)" strokeWidth="2" />
          </svg>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          
          <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Hexagon size={24} fill="var(--accent)" color="white" />
              <div style={{ width: '8px', height: '8px', background: 'var(--border-lavender)', borderRadius: '4px' }}></div>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Patient Gateway</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Seamless remote care</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, marginBottom: '3rem' }}>Drive performance with a dynamic, fully automated patient intake and booking process.</p>
            <div><button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => window.location.href='http://localhost:5176'}>Access Gateway &rarr;</button></div>
          </div>

          <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Hexagon size={24} fill="var(--accent)" color="white" />
              <div style={{ width: '8px', height: '8px', background: 'var(--border-lavender)', borderRadius: '4px' }}></div>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Doctor Hub</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Zero-latency WebRTC</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, marginBottom: '3rem' }}>Unlock rapid, data-driven encounters. Easily design and deploy balanced schedules and accurate prescriptions.</p>
            <div><button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => window.location.href='http://localhost:5174'}>Access Hub &rarr;</button></div>
          </div>

          <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Hexagon size={24} fill="var(--accent)" color="white" />
              <div style={{ width: '8px', height: '8px', background: 'var(--border-lavender)', borderRadius: '4px' }}></div>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Admin Console</h3>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Integrated verification</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', flex: 1, marginBottom: '3rem' }}>Get more from your data. Leverage our clinical teams to deploy strict verification models and advanced analytics.</p>
            <div><button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => window.location.href='http://localhost:5175'}>Access Console &rarr;</button></div>
          </div>

        </div>
      </section>

      {/* 4. Feature Showcase Section */}
      <section style={{ padding: '6rem 3rem', borderTop: '1px solid var(--border)', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
             <Hexagon size={20} fill="var(--accent)" color="white" /> MedLink Architect
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem', lineHeight: 1.1 }}>Fully optimized remote care</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Transform annual care planning into data-driven, <i>continuous</i> care. Architect helps hospital leaders create and manage fully-balanced physician territories and accurate, fair workloads that drive growth.
          </p>
          <button className="btn btn-primary">Learn more &rarr;</button>
        </div>

        {/* Hierarchical Flowchart Graphic */}
        <div className="dotted-bg" style={{ padding: '3rem', borderRadius: '24px', position: 'relative', minHeight: '400px' }}>
          
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', width: '300px', margin: '0 auto 3rem', border: '1px solid var(--border-lavender)', boxShadow: '0 10px 30px rgba(66, 63, 222, 0.1)', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>Global Hospital Network</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}><span>Total Quota</span> <span style={{color: 'var(--text-main)'}}>50,000 pts</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}><span>Amount Potential</span> <span style={{color: 'var(--text-main)'}}>85,000 pts</span></div>
          </div>

          <div style={{ position: 'absolute', top: '120px', left: '50%', width: '2px', height: '40px', background: 'var(--border-lavender)', zIndex: 1, transform: 'translateX(-50%)' }}></div>
          <div style={{ position: 'absolute', top: '160px', left: '25%', right: '25%', height: '2px', background: 'var(--border-lavender)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '160px', left: '25%', width: '2px', height: '40px', background: 'var(--border-lavender)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '160px', right: '25%', width: '2px', height: '40px', background: 'var(--border-lavender)', zIndex: 1 }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', width: '200px', border: '1px solid var(--border-lavender)', boxShadow: '0 10px 30px rgba(66, 63, 222, 0.05)', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>Region A (West)</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}><span>Total</span> <span>20,000</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}><span style={{width: 6, height: 6, borderRadius: 3, background: 'var(--success)'}}></span> Workload score</div>
            </div>
            
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', width: '200px', border: '1px solid var(--border-lavender)', boxShadow: '0 10px 30px rgba(66, 63, 222, 0.05)', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>Region B (East)</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}><span>Total</span> <span>30,000</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}><span style={{width: 6, height: 6, borderRadius: 3, background: 'var(--success)'}}></span> Workload score</div>
            </div>
          </div>

        </div>

      </section>

      {/* 5. Target Audience Grid Section */}
      <section style={{ padding: '0 3rem 6rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          <div className="enterprise-card" style={{ position: 'relative' }}>
            <Hexagon size={20} fill="var(--accent)" color="white" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Hospital Admins</h3>
            <p style={{ color: 'var(--text-muted)' }}>Align telemedicine capacity with strategic health goals</p>
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }} className="circular-btn">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="enterprise-card" style={{ position: 'relative' }}>
            <Hexagon size={20} fill="var(--accent)" color="white" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Clinical Leaders</h3>
            <p style={{ color: 'var(--text-muted)' }}>Get out of the weeds to focus on strategic work</p>
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }} className="circular-btn">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="enterprise-card" style={{ position: 'relative' }}>
            <Hexagon size={20} fill="var(--accent)" color="white" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Doctors</h3>
            <p style={{ color: 'var(--text-muted)' }}>Motivate providers. Maximize patient outcomes.</p>
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }} className="circular-btn">
              <ArrowRight size={18} />
            </div>
          </div>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          
          <div className="enterprise-card" style={{ position: 'relative' }}>
            <Hexagon size={20} fill="var(--accent)" color="white" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Finance</h3>
            <p style={{ color: 'var(--text-muted)' }}>Manage risk, control costs, and forecast confidently</p>
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }} className="circular-btn">
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="enterprise-card" style={{ position: 'relative' }}>
            <Hexagon size={20} fill="var(--accent)" color="white" style={{ marginBottom: '1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Human Resources</h3>
            <p style={{ color: 'var(--text-muted)' }}>Total provider compensation: Design & govern without complexity</p>
            <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }} className="circular-btn">
              <ArrowRight size={18} />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default App;
