import { motion } from 'framer-motion';
import { ArrowRight, Activity, ShieldCheck, UserCircle } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Navbar */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.04em' }}>
          <Activity color="white" />
          MedLink
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a href="http://localhost:5174" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Coordinator Portal</a>
          <a href="http://localhost:5175" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Doctor Portal</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1rem' }}>
        
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
          MedLink is the ultimate platform for seamless telemedicine, connecting patients with world-class specialists via zero-latency WebRTC video.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', gap: '1rem' }}
        >
          <a href="http://localhost:5176" className="btn btn-primary">
            Patient Portal <ArrowRight size={18} />
          </a>
        </motion.div>

      </main>

      {/* Feature Grid */}
      <section style={{ padding: '4rem 2rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '16px', background: '#050505' }}
        >
          <UserCircle size={32} color="white" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>For Patients</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Find verified doctors, book instant appointments, and join high-definition video consultations from anywhere.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '16px', background: '#050505' }}
        >
          <Activity size={32} color="white" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>For Doctors</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Manage your schedule, conduct secure WebRTC encounters, and issue immutable e-prescriptions in a sleek workspace.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '16px', background: '#050505' }}
        >
          <ShieldCheck size={32} color="white" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>For Coordinators</h3>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Verify doctor credentials and maintain the integrity of the MedLink platform through a secure admin console.</p>
        </motion.div>

      </section>
    </div>
  );
}

export default App;
