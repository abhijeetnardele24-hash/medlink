import { motion } from 'framer-motion';
import { Smartphone, ShieldCheck, Activity, Video, Database, Stethoscope } from 'lucide-react';

export default function ArchitectureDiagram() {
  return (
    <div className="relative w-full aspect-video flex items-center justify-center p-4 bg-transparent">
      
      {/* Central Hub */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 bg-brand-blue rounded-2xl flex items-center justify-center text-white z-20 shadow-lg relative"
      >
        <Activity size={40} />
      </motion.div>

      {/* Connection Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <svg className="w-full h-full" viewBox="0 0 600 337" preserveAspectRatio="none">
          {/* Top Left */}
          <path d="M 150 100 L 270 140" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          {/* Top Right */}
          <path d="M 450 100 L 330 140" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          {/* Bottom Left */}
          <path d="M 150 237 L 270 197" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
          {/* Bottom Right */}
          <path d="M 450 237 L 330 197" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Nodes */}
      {/* Node 1: Patient App (Top Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-[15%] left-[5%] bg-white border border-blue-200 rounded-xl p-4 shadow-sm w-[35%] z-20"
      >
        <div className="flex flex-col items-center mb-3">
          <div className="text-brand-blue mb-1">
            <Smartphone size={20} />
          </div>
          <span className="font-semibold text-sm">Patient App</span>
        </div>
        <div className="flex gap-2 justify-center">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> iOS</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> Android</span>
        </div>
      </motion.div>

      {/* Node 2: Doctor Portal (Top Right) */}
      <motion.div 
        initial={{ opacity: 0, x: 20, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-[15%] right-[5%] bg-white border border-blue-200 rounded-xl p-4 shadow-sm w-[35%] z-20"
      >
        <div className="flex flex-col items-center mb-3">
          <div className="text-brand-blue mb-1">
            <Stethoscope size={20} />
          </div>
          <span className="font-semibold text-sm">Doctor Portal</span>
        </div>
        <div className="flex gap-2 justify-center">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> Web</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> EMR</span>
        </div>
      </motion.div>

      {/* Node 3: WebRTC Relays (Bottom Left) */}
      <motion.div 
        initial={{ opacity: 0, x: -20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-[15%] left-[5%] bg-white border border-blue-200 rounded-xl p-4 shadow-sm w-[35%] z-20"
      >
        <div className="flex flex-col items-center mb-3">
          <div className="text-brand-blue mb-1">
            <Video size={20} />
          </div>
          <span className="font-semibold text-sm">WebRTC Relays</span>
        </div>
        <div className="flex gap-2 justify-center">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> Cloud</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> Edge</span>
        </div>
      </motion.div>

      {/* Node 4: HIPAA Gateway (Bottom Right) */}
      <motion.div 
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-[15%] right-[5%] bg-white border border-blue-200 rounded-xl p-4 shadow-sm w-[35%] z-20"
      >
        <div className="flex flex-col items-center mb-3">
          <div className="text-brand-blue mb-1">
            <ShieldCheck size={20} />
          </div>
          <span className="font-semibold text-sm">Security Gateway</span>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> AES-256</span>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><CheckCircleIcon /> Audit</span>
        </div>
      </motion.div>

    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
