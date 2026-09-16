import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, Activity, Stethoscope, Clock, Lock, CheckCircle2, ChevronRight, Video, FileText, Globe, Code, Layers, Smartphone, BookOpen, Users, Award, Phone } from 'lucide-react';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import EcosystemDiagram from './components/EcosystemDiagram';

function App() {
  const { scrollYProgress } = useScroll();
  
  return (
    <div className="min-h-screen bg-white text-text-main font-sans selection:bg-brand-blue selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-surface-accent transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-text-main">
              <Activity className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg text-text-main">medlink</span>
            <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
            <span className="font-medium text-base text-slate-500">enterprise</span>
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
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Telepsychiatry</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Primary Care</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Post-Op Monitoring</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Enterprise EMR</div>
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
                  <div className="flex-1 font-medium text-text-main">Documentation</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Code className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">API Reference</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Case Studies</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Blog</div>
                </a>
              </div>
            </div>

            {/* Company Dropdown */}
            <div className="relative group py-6">
              <a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-1">
                Company <ChevronRight className="w-3 h-3 rotate-90 group-hover:-rotate-90 transition-transform"/>
              </a>
              <div className="absolute top-full right-0 w-[300px] bg-white border border-slate-100 shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden p-3 flex flex-col gap-1">
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">About Us</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Careers</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Contact Sales</div>
                </a>
                <a href="#" className="flex items-center gap-4 px-3 py-3 hover:bg-blue-50 rounded-lg group/link transition-colors">
                  <div className="w-10 h-10 rounded-md bg-brand-blue flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 font-medium text-text-main">Partners</div>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a href="http://localhost:5174/login" className="text-sm font-medium text-text-main hover:text-brand-blue transition-colors">
              Log in
            </a>
            <button className="bg-[#3b6df6] hover:bg-blue-600 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
              Sign up
            </button>
          </div>
        </div>
      </nav>



      {/* Hero Section */}
      <section className="relative overflow-hidden flex flex-col lg:flex-row items-stretch">
        
        {/* Left Content */}
        <div className="w-full lg:w-[45%] pt-20 pb-20 px-6 lg:pl-24 lg:pr-12 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <h1 className="text-5xl md:text-[4.5rem] font-semibold mb-6 tracking-tight text-text-main leading-[1.1]">
              Adaptive telemedicine starts with <span className="text-brand-blue">MedLink</span>
            </h1>
            <p className="text-lg text-text-muted mb-8 leading-relaxed text-balance">
              Most telehealth platforms make choices for you - on infrastructure, models, and data boundaries. MedLink doesn't. Build, run, and govern healthcare pipelines on your own terms, in any environment.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button className="bg-[#3b6df6] hover:bg-blue-600 text-white px-6 py-2.5 rounded-md font-medium transition-all shadow-sm">
                Start Building
              </button>
              <button className="px-6 py-2.5 rounded-md font-medium bg-slate-100 hover:bg-slate-200 text-text-main transition-colors border border-slate-200">
                Explore Platform
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Right Content - Diagram area with faint grid bg */}
        <div className="w-full lg:w-[55%] bg-[#f4f7ff] relative p-8 lg:p-16 flex items-center justify-center border-l border-blue-100">
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

      {/* Developer Experience Section */}
      <section className="py-24 bg-slate-900 border-t border-slate-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#3b6df6_1px,transparent_1px)] [background-size:32px_32px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div>
              <div className="text-brand-blue font-semibold tracking-wide uppercase text-sm mb-3">Developer Experience</div>
              <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
                Integrate real-time care in minutes, not months.
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Our React SDK abstracts away the complexity of WebRTC, state synchronization, and HIPAA-compliant audit logs. Just drop in the components and focus on your application logic.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-brand-blue flex items-center justify-center shrink-0 border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Pre-built UI Components</h4>
                    <p className="text-slate-400 text-sm">Fully styled, accessible video rooms, chat interfaces, and prescription pads ready to deploy.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-brand-blue flex items-center justify-center shrink-0 border border-blue-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Type-Safe by Default</h4>
                    <p className="text-slate-400 text-sm">End-to-end TypeScript support ensures you catch errors at compile time.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Block */}
            <div className="bg-[#0d1117] rounded-xl border border-slate-800 p-6 shadow-2xl relative">
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-slate-400 text-xs font-mono mb-4 text-center">ConsultationRoom.tsx</div>
              <pre className="text-sm font-mono leading-relaxed overflow-x-auto text-slate-300">
                <code>
                  <span className="text-purple-400">import</span> {'{ MedLinkProvider, VideoRoom, Prescribe }'} <span className="text-purple-400">from</span> <span className="text-emerald-400">'@medlink/react'</span>;<br/><br/>
                  <span className="text-purple-400">export default function</span> <span className="text-blue-400">TelehealthVisit</span>({'{ encounterId }'}) {'{'}<br/>
                  {'  '}<span className="text-purple-400">return</span> (<br/>
                  {'    '}<span className="text-slate-500">{'// Initialize HIPAA-compliant context'}</span><br/>
                  {'    '}&lt;<span className="text-blue-400">MedLinkProvider</span> <span className="text-cyan-300">apiKey</span>=<span className="text-emerald-400">"pk_live_..."</span>&gt;<br/>
                  {'      '}&lt;<span className="text-blue-400">div</span> <span className="text-cyan-300">className</span>=<span className="text-emerald-400">"grid grid-cols-2 gap-4"</span>&gt;<br/>
                  {'        '}&lt;<span className="text-blue-400">VideoRoom</span> <br/>
                  {'          '}<span className="text-cyan-300">encounterId</span>={'{encounterId}'} <br/>
                  {'          '}<span className="text-cyan-300">recording</span>={'{true}'} <br/>
                  {'        '/}&gt;<br/>
                  {'        '}&lt;<span className="text-blue-400">Prescribe</span> <span className="text-cyan-300">context</span>={'{encounterId}'} /&gt;<br/>
                  {'      '}&lt;/<span className="text-blue-400">div</span>&gt;<br/>
                  {'    '}&lt;/<span className="text-blue-400">MedLinkProvider</span>&gt;<br/>
                  {'  '});<br/>
                  {'}'}
                </code>
              </pre>
            </div>

          </div>
        </div>
      </section>

      {/* Deep Dive Capabilities */}
      <section className="py-24 border-t border-surface-accent bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold mb-6 text-text-main leading-tight">
              Engineered for the demands of modern healthcare
            </h2>
            <p className="text-lg text-text-muted">
              MedLink provides the primitives you need to build scalable, compliant telehealth applications without compromising on performance or security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-2xl mb-4">WebRTC Infrastructure</h3>
              <p className="text-text-muted leading-relaxed mb-4">
                Our globally distributed edge network ensures sub-50ms latency for real-time video and audio. Built-in resilient reconnections handle spotty cellular networks gracefully, maintaining patient context.
              </p>
              <a href="#" className="text-brand-blue font-medium flex items-center gap-1 hover:gap-2 transition-all">Read docs <ChevronRight className="w-4 h-4" /></a>
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-2xl mb-4">State & Context Sync</h3>
              <p className="text-text-muted leading-relaxed mb-4">
                Synchronize vital signs, EHR records, and prescription data in real-time across all participants. Every action is recorded to an immutable audit ledger, simplifying compliance reporting.
              </p>
              <a href="#" className="text-brand-blue font-medium flex items-center gap-1 hover:gap-2 transition-all">View architecture <ChevronRight className="w-4 h-4" /></a>
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-2xl mb-4">Zero-Trust Security</h3>
              <p className="text-text-muted leading-relaxed mb-4">
                End-to-end AES-256 encryption secures data in transit and at rest. We provide fine-grained Role-Based Access Control (RBAC) and dynamic data masking to ensure PHI is only visible to authorized personnel.
              </p>
              <a href="#" className="text-brand-blue font-medium flex items-center gap-1 hover:gap-2 transition-all">Security whitepaper <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold text-slate-500 tracking-widest uppercase mb-8">Enterprise-Grade Compliance</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-70 grayscale">
            <div className="text-2xl font-black text-slate-800 tracking-tight">HIPAA Compliant</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">SOC 2 Type II</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">GDPR Ready</div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">ISO 27001</div>
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

      {/* Final CTA */}
      <section className="py-24 bg-brand-blue text-white text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
            Ready to build the future of telemedicine?
          </h2>
          <p className="text-lg text-blue-100 mb-10 leading-relaxed">
            Join the innovative healthcare organizations building scalable, compliant, and sovereign telehealth pipelines with MedLink. Deploy in your cloud, on-prem, or at the edge.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <button className="bg-white text-brand-blue hover:bg-slate-50 px-8 py-3 rounded-md font-semibold transition-all shadow-lg text-lg">
              Start Building Now
            </button>
            <button className="px-8 py-3 rounded-md font-medium text-white border border-white/30 hover:bg-white/10 transition-colors text-lg">
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center text-text-main">
                  <Activity className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="font-semibold text-lg text-text-main">medlink</span>
                <div className="h-5 w-px bg-slate-300 mx-1.5"></div>
                <span className="font-medium text-base text-slate-500">enterprise</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-text-main mb-4 text-sm">Products</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand-blue transition-colors">Enterprise Platform</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Cloud Relays</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Open Source</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-main mb-4 text-sm">Resources</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand-blue transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Case Studies</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-main mb-4 text-sm">Company</h4>
              <ul className="space-y-3 text-sm text-text-muted">
                <li><a href="#" className="hover:text-brand-blue transition-colors">About</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-blue transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <p>© 2026 MedLink Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-brand-blue transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-blue transition-colors">Imprint</a>
            </div>
          </div>
        </div>
      </footer>
      
    </div>
  );
}

export default App;
