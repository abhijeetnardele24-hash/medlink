import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Activity, Stethoscope, Clock, Lock, CheckCircle2, ChevronRight, Video, FileText, Globe, Code, Layers, Smartphone, BookOpen, Users, Award, Phone, Brain } from 'lucide-react';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import EcosystemDiagram from './components/EcosystemDiagram';

function App() {
  const { scrollYProgress } = useScroll();
  
  return (
    <div className="min-h-screen bg-white text-text-main font-sans selection:bg-brand-blue selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-surface-accent transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-text-main">
              <Activity className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-text-main">MedLink</span>
            <div className="h-7 w-px bg-slate-300 mx-2"></div>
            <span className="font-medium text-xl tracking-tight text-slate-500">Enterprise</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-main">
            {/* Products Dropdown */}
            <div className="relative group py-6">
              <a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-1">
                Products & Services <ChevronRight className="w-3 h-3 rotate-90 group-hover:-rotate-90 transition-transform"/>
              </a>
              <div className="absolute top-full left-0 w-[340px] bg-white border border-slate-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden p-3 flex flex-col gap-1">
                <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Doctor Portal</div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                
                <a href="http://localhost:5175" target="_blank" rel="noreferrer" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Patient App</div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>

                <a href="http://localhost:5176" target="_blank" rel="noreferrer" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Pharmacy Portal</div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>

                <a href="http://localhost:5177" target="_blank" rel="noreferrer" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Coordinator Portal</div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group py-6">
              <a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-1">
                Solutions <ChevronRight className="w-3 h-3 rotate-90 group-hover:-rotate-90 transition-transform"/>
              </a>
              <div className="absolute top-full left-0 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden p-3 flex flex-col gap-1">
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Telepsychiatry</div>
                    <div className="text-xs text-text-muted">Remote mental health consultations</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Primary Care</div>
                    <div className="text-xs text-text-muted">General practice telehealth visits</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Post-Op Monitoring</div>
                    <div className="text-xs text-text-muted">Remote patient recovery tracking</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Enterprise EMR</div>
                    <div className="text-xs text-text-muted">Integrated electronic medical records</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>

            {/* Resources Dropdown */}
            <div className="relative group py-6">
              <a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-1">
                Resources <ChevronRight className="w-3 h-3 rotate-90 group-hover:-rotate-90 transition-transform"/>
              </a>
              <div className="absolute top-full left-0 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden p-3 flex flex-col gap-1">
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Documentation</div>
                    <div className="text-xs text-text-muted">Guides, SDK references &amp; setup</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">API Reference</div>
                    <div className="text-xs text-text-muted">REST &amp; WebSocket endpoints</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Case Studies</div>
                    <div className="text-xs text-text-muted">Real-world deployment stories</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Blog</div>
                    <div className="text-xs text-text-muted">News, updates &amp; engineering posts</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="relative group py-6">
              <a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-1">
                Company <ChevronRight className="w-3 h-3 rotate-90 group-hover:-rotate-90 transition-transform"/>
              </a>
              <div className="absolute top-full left-0 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden p-3 flex flex-col gap-1">
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">About Us</div>
                    <div className="text-xs text-text-muted">Our mission &amp; the team behind MedLink</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Careers</div>
                    <div className="text-xs text-text-muted">Open roles &amp; work culture</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Contact Sales</div>
                    <div className="text-xs text-text-muted">Talk to our enterprise team</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text-main">Partners</div>
                    <div className="text-xs text-text-muted">Integration &amp; reseller programs</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-brand-blue flex items-center justify-center text-brand-blue opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="http://localhost:5174/login" className="text-sm font-medium text-text-main hover:text-brand-blue transition-colors">
              Log in
            </a>
            <button className="bg-brand-blue hover:bg-brand-hover text-white px-5 py-2.5 rounded text-sm font-medium transition-colors shadow-lg shadow-brand-blue/20">
              Sign up
            </button>
          </div>
        </div>
      </nav>



      {/* Hero Section */}
      <section className="relative overflow-hidden flex flex-col lg:flex-row items-stretch">
        
        {/* Left Content */}
        <div className="w-full lg:w-1/2 pt-20 pb-20 px-6 lg:pl-24 lg:pr-12 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5 text-text-main leading-[1.15]">
              Real-time telemedicine,<br/>built for <span className="text-brand-blue">clinical teams</span>
            </h1>
            <p className="text-base text-text-muted mb-8 leading-relaxed max-w-md">
              MedLink is an open telehealth platform for doctors, patients, and hospital systems. Conduct secure video consultations, manage prescriptions, and coordinate care — from one unified platform you control.
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="bg-brand-blue hover:bg-brand-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-all shadow-sm">
                Sign up for free
              </button>
              <button className="px-5 py-2.5 rounded-md text-sm font-medium bg-surface-accent hover:bg-slate-200 text-text-main transition-colors border border-slate-200">
                Explore Platform
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Right Content - Diagram area with faint grid bg */}
        <div className="w-full lg:w-1/2 bg-[#f4f7ff] relative p-8 lg:p-16 flex items-center justify-center border-l border-blue-100">
          <div className="absolute inset-0 bg-[radial-gradient(#93a5ff_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40"></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-10 w-full"
          >
            <ArchitectureDiagram />
          </motion.div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-24 border-t border-surface-accent bg-white">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-main leading-tight">
              Why organizations<br/>choose MedLink
            </h2>
            <p className="text-lg text-text-muted">
              The open platform to build, run, and govern secure healthcare pipelines and applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-accent border border-surface-accent">
            
            {/* Box 1 */}
            <div className="bg-white p-8 flex flex-col relative group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Open Source Foundation</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Build on transparent, auditable code and open standards. Healthcare primitives – streaming, relays, EHR connectors – are yours to own, swap, and extend. No lock-in.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white p-8 flex flex-col relative group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Context-Engineered Care</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Your video pipelines behave the way you designed them to. Define what they know, what they can do, and how they route. Every step is explicit and inspectable.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white p-8 flex flex-col relative group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Sovereign by Design</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Your infrastructure, your data, your compliance posture. Deploy wherever your requirements demand – cloud or self-hosted – with audit logs, RBAC, and data lineage built in.
              </p>
            </div>

            {/* Box 4 */}
            <div className="bg-white p-8 flex flex-col relative group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Proven in Production</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Ship systems that survive contact with real patients, real data, and real scale. From first pilot to governed, versioned, observable systems – without rebuilding.
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="py-24 bg-surface-beige border-t border-surface-accent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            <div className="sticky top-32">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-main leading-tight">
                Control today.<br/>Advantage tomorrow.
              </h2>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-brand-blue leading-tight">
                Why Sovereign Healthcare wins
              </h2>
              
              <div className="flex flex-wrap items-center gap-4">
                <button className="bg-brand-blue hover:bg-brand-hover text-white px-6 py-3 rounded font-medium transition-all shadow-lg shadow-brand-blue/20">
                  Start Building
                </button>
                <button className="px-6 py-3 rounded font-medium bg-surface-accent hover:bg-slate-200 text-text-main transition-colors">
                  Explore Platform
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-12">
              
              <div className="border-b border-slate-200 pb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded border border-blue-200 bg-white text-brand-blue flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-xl">1. Performance</h3>
                </div>
                <p className="text-text-muted pl-11">
                  Tune video encoding, WebRTC relays, and routing around the workload instead of settling for defaults.
                </p>
              </div>

              <div className="border-b border-slate-200 pb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded border border-blue-200 bg-white text-brand-blue flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-xl">2. Cost</h3>
                </div>
                <p className="text-text-muted pl-11">
                  Optimize compute, providers, and deployment footprints with transparent architecture choices.
                </p>
              </div>

              <div className="border-b border-slate-200 pb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded border border-blue-200 bg-white text-brand-blue flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-xl">3. Innovation</h3>
                </div>
                <p className="text-text-muted pl-11">
                  Adopt new codecs and components without rebuilding applications around another platform.
                </p>
              </div>

              <div className="pb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded border border-blue-200 bg-white text-brand-blue flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-xl">4. Resilience</h3>
                </div>
                <p className="text-text-muted pl-11">
                  Keep critical telehealth workflows portable, observable, and aligned with internal compliance.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-24 bg-white border-t border-surface-accent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 text-brand-blue leading-tight">
              Build & run on MedLink
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-text-main leading-tight">
              Your platform. Your ecosystem.
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Cards */}
            <div className="w-full lg:w-2/5 flex flex-col gap-4">
              
              <div className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white flex flex-col gap-3">
                <div className="flex items-center gap-3 font-semibold text-text-main text-lg mb-1">
                  <div className="w-8 h-8 rounded bg-brand-blue text-white flex items-center justify-center">
                    <Code className="w-4 h-4" />
                  </div>
                  MedLink Open Source
                </div>
                <p className="text-text-muted text-sm leading-relaxed">Compose telemedicine pipelines using any models, tools, and architectures.</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Modular</span>
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Flexible</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white flex flex-col gap-3">
                <div className="flex items-center gap-3 font-semibold text-text-main text-lg mb-1">
                  <div className="w-8 h-8 rounded bg-brand-blue text-white flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  MedLink Enterprise Platform
                </div>
                <p className="text-text-muted text-sm leading-relaxed">Build, evaluate, deploy, and govern healthcare applications at scale.</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Build</span>
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Test</span>
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Deploy</span>
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Govern</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white flex flex-col gap-3">
                <div className="flex items-center gap-3 font-semibold text-text-main text-lg mb-1">
                  <div className="w-8 h-8 rounded bg-brand-blue text-white flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  Deploy Anywhere
                </div>
                <p className="text-text-muted text-sm leading-relaxed">Run in the environment you choose, with strict data boundaries.</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Cloud</span>
                  <span className="text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded">Self-Hosted</span>
                </div>
              </div>
              
            </div>

            {/* Right Diagram */}
            <div className="w-full lg:w-3/5 border border-slate-200 rounded-xl bg-white relative overflow-hidden">
              <EcosystemDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center text-text-main">
                  <Activity className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-text-main">MedLink</span>
                <div className="h-6 w-px bg-slate-300 mx-1"></div>
                <span className="font-medium text-lg tracking-tight text-slate-500">Enterprise</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed max-w-xs">
                An open telehealth platform for doctors, patients, and hospital systems.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-text-main mb-4 text-sm">Products</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><a href="http://localhost:5174" className="hover:text-brand-blue transition-colors">Doctor Portal</a></li>
                <li><a href="http://localhost:5175" className="hover:text-brand-blue transition-colors">Patient App</a></li>
                <li><a href="http://localhost:5176" className="hover:text-brand-blue transition-colors">Pharmacy Portal</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-main mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand-blue transition-colors">About</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© 2026 MedLink Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-brand-blue transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;
