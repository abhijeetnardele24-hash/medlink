import { motion } from 'framer-motion';
import { Smartphone, Stethoscope, Server, Store, Activity, Cloud, RefreshCw, Zap, Shield, Database } from 'lucide-react';

export const ArchitectureDiagram = () => {
  return (
    <div style={{ 
      width: '100%', 
      background: '#09090b', // Deep slate/zinc for high contrast 
      border: '1px solid rgba(255, 255, 255, 0.1)', 
      borderRadius: '24px',
      padding: '4rem 3rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle grid overlay inside diagram */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.5, pointerEvents: 'none' }}></div>

      {/* Portals Layer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
        
        <motion.div whileHover={{ y: -5 }} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px' }}>
            <Smartphone size={24} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Patient Portal</div>
            <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '0.25rem' }}>React / Vite / PWA</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Stethoscope size={24} color="#60a5fa" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Doctor Hub</div>
            <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '0.25rem' }}>WebRTC & Prescriptions</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Shield size={24} color="#34d399" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Coordinator Console</div>
            <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '0.25rem' }}>Admin / Triage</div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Store size={24} color="#fbbf24" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Pharmacy Portal</div>
            <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '0.25rem' }}>Marketplace & Fulfillment</div>
          </div>
        </motion.div>

      </div>

      {/* Middle Connection Area */}
      <div style={{ height: '220px', position: 'relative' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          {/* Animated Paths flowing to the center */}
          <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 1 }} d="M12.5%,0 Q50%,100 50%,100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
          <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 1, delay: 0.2 }} d="M37.5%,0 Q50%,100 50%,100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
          <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 1, delay: 0.4 }} d="M62.5%,0 Q50%,100 50%,100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
          <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop', repeatDelay: 1, delay: 0.6 }} d="M87.5%,0 Q50%,100 50%,100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
          
          {/* WebRTC Direct P2P line (Patient <-> Doctor) */}
          <motion.path initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} d="M12.5%,0 C20%,40 30%,40 37.5%,0" fill="none" stroke="#3b82f6" strokeWidth="3" />
        </svg>

        <div style={{ position: 'absolute', top: '25%', left: '25%', transform: 'translate(-50%, -50%)', background: '#1e3a8a', border: '1px solid #3b82f6', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'white', fontWeight: 600, boxShadow: '0 0 15px rgba(59,130,246,0.5)', zIndex: 10 }}>
          P2P WebRTC
        </div>

        {/* Central Hub */}
        <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '1.5rem', zIndex: 10 }}>
          <div style={{ background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem 2.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <Activity size={24} color="white" />
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Node.js API Gateway</div>
          </div>
          <div style={{ background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem 2.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            <Zap size={24} color="#f59e0b" />
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Socket.IO Signaling</div>
          </div>
        </div>
      </div>

      {/* Database/Storage Layer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '7rem', position: 'relative', zIndex: 10 }}>
        <motion.div whileHover={{ y: -2 }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Database size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>PostgreSQL</span>
        </motion.div>
        
        <motion.div whileHover={{ y: -2 }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <Cloud size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>Firebase Blob Storage</span>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <RefreshCw size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>Offline Sync Queue</span>
        </motion.div>
      </div>

    </div>
  );
};
