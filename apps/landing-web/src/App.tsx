import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Activity, Stethoscope, Clock, Lock, CheckCircle2, ChevronRight, Video, FileText, Globe } from 'lucide-react';
import ArchitectureDiagram from './components/ArchitectureDiagram';

function App() {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div className="min-h-screen bg-surface-dark text-white font-sans selection:bg-brand-blue selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface-dark/80 backdrop-blur-md border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">MedLink Enterprise</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Platform</a>
            <a href="#" className="hover:text-white transition-colors">Solutions</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Case Studies</a>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="hidden md:block text-sm font-medium hover:text-white transition-colors">Log in</a>
            <button className="bg-brand-blue hover:bg-brand-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(51,86,241,0.4)]">
              Book Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                MedLink Enterprise 2.0
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                The Sovereign <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-emerald-400">Telemedicine</span> Platform.
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-lg leading-relaxed text-balance">
                Deploy production healthcare infrastructure with full control. Build highly secure, zero-latency video consultation pipelines trusted by global hospitals.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <button className="bg-brand-blue hover:bg-brand-hover text-white px-6 py-3.5 rounded-lg font-medium transition-all shadow-[0_0_20px_rgba(51,86,241,0.4)] flex items-center gap-2 group">
                  Start Building
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-6 py-3.5 rounded-lg font-medium border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Read Docs
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <ArchitectureDiagram />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-8 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-dark to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-dark to-transparent z-10" />
        
        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">Trusted by leading healthcare providers</p>
        <div className="flex w-fit animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-16 px-8">
              <span className="text-xl font-bold text-slate-600">Mayo Clinic</span>
              <span className="text-xl font-bold text-slate-600">Cleveland Clinic</span>
              <span className="text-xl font-bold text-slate-600">Johns Hopkins</span>
              <span className="text-xl font-bold text-slate-600">Mount Sinai</span>
              <span className="text-xl font-bold text-slate-600">Kaiser Permanente</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Zig Zag Sections */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-40">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="order-2 lg:order-1"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Video className="w-32 h-32 text-brand-blue opacity-80 group-hover:scale-110 transition-transform duration-700" />
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Zero-Latency Virtual Care.</h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Build real-time consultation experiences with our optimized WebRTC relays. MedLink's infrastructure ensures crystal-clear HD video and audio, even on low-bandwidth networks, ensuring equitable access to care.
              </p>
              <ul className="space-y-4">
                {['Sub-50ms global latency', 'Adaptive bitrate streaming', 'Automatic reconnection handling'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-40">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">HIPAA Compliant by Default.</h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Security isn't an afterthought. The MedLink Enterprise platform wraps every data packet in military-grade encryption. We provide BAA signing and full audit trails out of the box.
              </p>
              <ul className="space-y-4">
                {['End-to-end AES-256 encryption', 'SOC 2 Type II & HIPAA certified', 'Granular role-based access control (RBAC)'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-brand-blue shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Lock className="w-32 h-32 text-emerald-400 opacity-80 group-hover:scale-110 transition-transform duration-700" />
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-24 relative overflow-hidden bg-brand-dark border-y border-brand-blue/20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <Shield className="w-16 h-16 text-brand-blue mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-6">Ready to upgrade your infrastructure?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join the hundreds of healthcare providers who have migrated to MedLink Enterprise for unparalleled stability and security.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="bg-brand-blue hover:bg-brand-hover text-white px-8 py-4 rounded-lg font-medium text-lg transition-all shadow-[0_0_20px_rgba(51,86,241,0.4)]">
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-dark border-t border-slate-800 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">MedLink</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs">
                The sovereign telemedicine platform for modern healthcare organizations. Secure, scalable, and built for the future of care.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-brand-blue transition-colors">Video Consultations</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Patient Portal</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">EMR Integration</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Security Architecture</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-brand-blue transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><a href="#" className="hover:text-brand-blue transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 MedLink Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">HIPAA Compliance</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;
