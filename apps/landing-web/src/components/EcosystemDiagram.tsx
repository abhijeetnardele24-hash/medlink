import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Cloud, Shield, Video, Server, Users, Settings } from 'lucide-react';

export default function EcosystemDiagram() {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-slate-50/50 overflow-hidden">
      
      {/* Concentric Circles */}
      <div className="absolute w-[800px] h-[800px] rounded-full border border-slate-200 bg-white/50" />
      <div className="absolute w-[600px] h-[600px] rounded-full border border-slate-200 bg-white/80 shadow-[inset_0_0_50px_rgba(0,0,0,0.02)]" />
      <div className="absolute w-[400px] h-[400px] rounded-full border border-slate-200 bg-white shadow-[0_0_50px_rgba(0,0,0,0.04)]" />
      
      {/* Central Hub */}
      <div className="relative z-10 w-32 h-32 bg-brand-blue rounded-3xl flex flex-col items-center justify-center text-white shadow-2xl shadow-brand-blue/30">
        <Activity size={48} className="mb-2" />
        <span className="text-[10px] font-semibold tracking-wider">Sovereign Health</span>
      </div>

      {/* Orbiting Icons - Inner Circle */}
      <div className="absolute w-[400px] h-[400px] animate-[spin_60s_linear_infinite]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-orange-500 animate-[spin_60s_linear_infinite_reverse]">
          <Database size={24} />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-blue-500 animate-[spin_60s_linear_infinite_reverse]">
          <Cloud size={24} />
        </div>
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-emerald-500 animate-[spin_60s_linear_infinite_reverse]">
          <Shield size={24} />
        </div>
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-purple-500 animate-[spin_60s_linear_infinite_reverse]">
          <Video size={24} />
        </div>
      </div>

      {/* Orbiting Icons - Outer Circle */}
      <div className="absolute w-[600px] h-[600px] animate-[spin_90s_linear_infinite_reverse]">
        <div className="absolute top-[14%] left-[14%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-700 animate-[spin_90s_linear_infinite]">
          <Server size={28} />
        </div>
        <div className="absolute bottom-[14%] right-[14%] translate-x-1/2 translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-700 animate-[spin_90s_linear_infinite]">
          <Users size={28} />
        </div>
        <div className="absolute top-[14%] right-[14%] translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-700 animate-[spin_90s_linear_infinite]">
          <Settings size={28} />
        </div>
        <div className="absolute bottom-[14%] left-[14%] -translate-x-1/2 translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-brand-blue animate-[spin_90s_linear_infinite]">
          <Activity size={28} />
        </div>
      </div>

    </div>
  );
}
