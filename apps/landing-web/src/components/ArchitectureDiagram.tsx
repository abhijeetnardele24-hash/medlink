import { motion } from 'framer-motion';
import { Smartphone, Server, Monitor, ShieldCheck, Activity, Video } from 'lucide-react';

export default function ArchitectureDiagram() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[400px] flex items-center justify-between p-8">
      {/* Background connecting lines */}
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <svg className="w-full h-full opacity-20" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M 150 200 L 500 100 L 850 200" fill="none" stroke="#3356f1" strokeWidth="4" strokeDasharray="10 10" className="animate-pulse" />
          <path d="M 150 200 L 500 300 L 850 200" fill="none" stroke="#3356f1" strokeWidth="4" strokeDasharray="10 10" className="animate-pulse" />
          <path d="M 500 100 L 500 300" fill="none" stroke="#3356f1" strokeWidth="4" strokeDasharray="10 10" />
        </svg>
      </div>

      {/* Node 1: Patient App */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex flex-col items-center gap-4 bg-surface-accent p-6 rounded-2xl border border-slate-700 w-48 shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-brand-blue/20 rounded-xl flex items-center justify-center text-brand-blue">
          <Smartphone size={32} />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-white">Patient App</h3>
          <p className="text-xs text-slate-400 mt-1">iOS, Android, Web</p>
        </div>
      </motion.div>

      {/* Node 2: Central Server / Infrastructure */}
      <div className="flex flex-col gap-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-4 bg-brand-blue/10 p-6 rounded-2xl border border-brand-blue/30 w-56 shadow-[0_0_30px_rgba(51,86,241,0.2)] backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-white">HIPAA Gateway</h3>
            <p className="text-xs text-brand-blue/80 mt-1">End-to-End Encryption</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4 bg-surface-accent p-6 rounded-2xl border border-slate-700 w-56 shadow-2xl backdrop-blur-sm"
        >
          <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
            <Video size={32} />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-white">WebRTC Relays</h3>
            <p className="text-xs text-slate-400 mt-1">Sub-50ms Latency</p>
          </div>
        </motion.div>
      </div>

      {/* Node 3: Doctor Dashboard */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4 bg-surface-accent p-6 rounded-2xl border border-slate-700 w-48 shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-brand-blue/20 rounded-xl flex items-center justify-center text-brand-blue">
          <Monitor size={32} />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-white">Doctor Portal</h3>
          <p className="text-xs text-slate-400 mt-1">EMR Integrated</p>
        </div>
      </motion.div>

      {/* Moving Particles */}
      <motion.div 
        className="absolute w-3 h-3 bg-brand-blue rounded-full shadow-[0_0_10px_#3356f1] z-20"
        animate={{ 
          x: [-350, 0, 350],
          y: [0, -100, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] z-20"
        animate={{ 
          x: [350, 0, -350],
          y: [0, 100, 0],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
      />
    </div>
  );
}
