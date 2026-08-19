import { motion } from 'framer-motion';
import { Smartphone, Stethoscope, Server, Store, Activity, Cloud, RefreshCw, Zap, Shield, Database } from 'lucide-react';

const DataPacket = ({ pathId, delay = 0, color = "#6366f1", reverse = false }: { pathId: string, delay?: number, color?: string, reverse?: boolean }) => {
  return (
    <motion.circle
      r="4"
      fill={color}
      initial={{ offsetDistance: reverse ? "100%" : "0%" }}
      animate={{ offsetDistance: reverse ? "0%" : "100%" }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "linear",
        delay: delay
      }}
      style={{ 
        filter: `drop-shadow(0 0 6px ${color})`,
        offsetPath: `url(#${pathId})`
      } as any}
    />
  );
};

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
      {/* Subtle animated grid overlay inside diagram */}
      <motion.div 
        animate={{ backgroundPosition: ['0px 0px', '30px 30px'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.4, pointerEvents: 'none' }} 
      />

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
          <motion.div animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 15px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)'] }} transition={{ duration: 3, repeat: Infinity }} style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Stethoscope size={24} color="#818cf8" />
          </motion.div>
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

      {/* Connection Area */}
      <div style={{ height: '350px', position: 'relative' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
          
          {/* Path Definitions */}
          <defs>
            <path id="path-patient" d="M12.5%,0 Q12.5%,50 50%,50" fill="none" />
            <path id="path-doctor" d="M37.5%,0 C37.5%,25 50%,25 50%,50" fill="none" />
            <path id="path-admin" d="M62.5%,0 C62.5%,25 50%,25 50%,50" fill="none" />
            <path id="path-pharm" d="M87.5%,0 Q87.5%,50 50%,50" fill="none" />
            
            <path id="path-db1" d="M50%,70 C30%,70 16.6%,80 16.6%,100" fill="none" />
            <path id="path-db2" d="M50%,70 L50%,100" fill="none" />
            <path id="path-db3" d="M50%,70 C70%,70 83.3%,80 83.3%,100" fill="none" />
            
            {/* P2P Path */}
            <path id="path-p2p" d="M12.5%,0 C20%,25 30%,25 37.5%,0" fill="none" />
          </defs>

          {/* Rendered Lines (Top to Center) */}
          <path d="M12.5%,0 Q12.5%,50 50%,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M37.5%,0 C37.5%,25 50%,25 50%,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M62.5%,0 C62.5%,25 50%,25 50%,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M87.5%,0 Q87.5%,50 50%,50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Rendered Lines (Center to Bottom) */}
          <path d="M50%,70 C30%,70 16.6%,80 16.6%,100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M50%,70 L50%,100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M50%,70 C70%,70 83.3%,80 83.3%,100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 4" />

          {/* WebRTC Direct P2P line */}
          <motion.path 
            initial={{ strokeDasharray: "0 1000" }} 
            animate={{ strokeDasharray: ["0 1000", "500 0"] }} 
            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }} 
            d="M12.5%,0 C20%,25 30%,25 37.5%,0" 
            fill="none" stroke="#6366f1" strokeWidth="3" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.8))' }} 
          />

          {/* Live Data Packets (Dots) */}
          <DataPacket pathId="path-patient" delay={0} color="#6366f1" />
          <DataPacket pathId="path-patient" delay={1.25} color="#6366f1" />
          <DataPacket pathId="path-doctor" delay={0.5} color="#6366f1" />
          <DataPacket pathId="path-admin" delay={0.8} color="#34d399" />
          <DataPacket pathId="path-pharm" delay={0.2} color="#fbbf24" reverse />

          {/* Downward Data Packets */}
          <DataPacket pathId="path-db1" delay={0.2} color="#a1a1aa" />
          <DataPacket pathId="path-db2" delay={1.0} color="#6366f1" />
          <DataPacket pathId="path-db3" delay={0.6} color="#34d399" />
        </svg>

        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '25%', transform: 'translate(-50%, -50%)', background: '#312e81', border: '1px solid #6366f1', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'white', fontWeight: 600, boxShadow: '0 0 15px rgba(99,102,241,0.5)', zIndex: 10 }}
        >
          P2P Video Stream
        </motion.div>

        {/* Central Hub */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '1.5rem', zIndex: 10 }}>
          <motion.div 
            animate={{ boxShadow: ['0 10px 30px rgba(0,0,0,0.6)', '0 10px 40px rgba(99,102,241,0.3)', '0 10px 30px rgba(0,0,0,0.6)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem 2.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <Activity size={24} color="#6366f1" />
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>API Gateway</div>
          </motion.div>
          
          <motion.div 
            animate={{ boxShadow: ['0 10px 30px rgba(0,0,0,0.6)', '0 10px 40px rgba(245,158,11,0.2)', '0 10px 30px rgba(0,0,0,0.6)'] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ background: '#27272a', border: '1px solid rgba(255,255,255,0.1)', padding: '1.25rem 2.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <Zap size={24} color="#fbbf24" />
            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>Signaling</div>
          </motion.div>
        </div>
      </div>

      {/* Database/Storage Layer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', position: 'relative', zIndex: 10 }}>
        <motion.div whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'background 0.2s' }}>
          <Database size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>PostgreSQL</span>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'background 0.2s' }}>
          <Cloud size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>Blob Storage</span>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }} style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', transition: 'background 0.2s' }}>
          <RefreshCw size={18} color="#a1a1aa" />
          <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600 }}>Offline Sync Queue</span>
        </motion.div>
      </div>

    </div>
  );
};
