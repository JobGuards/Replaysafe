"use client";

import Link from "next/link";
import { useState } from "react";
import { NewNav } from "@/components/NewNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Activity, 
  Database, 
  RefreshCw, 
  Bell, 
  Heart, 
  History, 
  Zap, 
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Lock,
  Wifi
} from "lucide-react";

const START_COMMAND = "curl -fsS https://stillup.io/hb/your-token";

export default function LandingPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  async function copyStart() {
    try {
      await navigator.clipboard.writeText(START_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this command:", START_COMMAND);
    }
  }

  const faqs = [
    { q: "What is StillUp?", a: "StillUp is a reliability platform that combines heartbeat monitoring for infrastructure with ReplayGuard for background job safety. We ensure your backups run and your job retries are idempotent." },
    { q: "What is ReplayGuard?", a: "ReplayGuard makes retrying failed jobs safe. It tracks side effects (payments, emails) using cryptographic fingerprints to prevent duplicate execution during retries." },
    { q: "How does it monitor Tunnels?", a: "We track handshake age and latency for WireGuard, SSH, and OpenVPN. If your tunnel degrades or keys go stale, we detect it without intercepting traffic." },
    { q: "Can I report failures explicitly?", a: "Yes! You can use our CLI or SDK to report failures, measure latency, and guard side effects with exactly-once semantics." },
    { q: "What is 'Execution Memory'?", a: "StillUp remembers past failures and successful side effects. We help you find patterns and ensure that retrying a job never charges a customer twice." },
    { q: "Does it work with my existing tools?", a: "StillUp works anywhere curl works. We also integrate with Slack, Discord, and PagerDuty for alerting." },
  ];

  return (
    <div className="antialiased min-h-screen flex flex-col relative bg-background bg-tech-grid overflow-x-hidden text-foreground z-0">
        {/* Dynamic Background Elements */}
        <div className="radial-glow-hero opacity-40"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="particle" style={{ left: '10%', animationDelay: '0s', height: '150px' }}></div>
          <div className="particle" style={{ left: '30%', animationDelay: '2s', height: '80px' }}></div>
          <div className="particle" style={{ left: '70%', animationDelay: '1.5s', height: '200px' }}></div>
          <div className="particle" style={{ left: '85%', animationDelay: '0.5s', height: '120px' }}></div>
        </div>
        
        {/* TopNavBar */}
        <NewNav userEmail={user?.email || null} />

        <main className="flex-grow pt-40 pb-xl px-margin max-w-7xl mx-auto w-full flex flex-col items-center gap-xl relative z-10">
          {/* Hero Section */}
          <section className="text-center flex flex-col items-center gap-lg max-w-4xl mx-auto mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acid-lime/20 bg-acid-lime/5 backdrop-blur text-xs font-code-md text-acid-lime mb-4 shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.1)]">
              <span className="w-2 h-2 rounded-full bg-acid-lime animate-pulse"></span>
              <span className="tracking-[0.2em] uppercase text-[10px] font-black italic">Sentinel_Protocol: Active</span>
            </div>
            <h1 className="text-headline-xl font-headline-xl text-foreground uppercase tracking-tight">
              The <span className="glow-lime font-black">Open Source</span> <br/> Reliability Platform.
            </h1>
            <p className="text-body-lg font-body-lg text-muted-foreground max-w-2xl mt-2">
              Deep observability for Crons, Secure Tunnels, and <b>Safe Background Jobs</b>. Free to self-host, secure by default, and built for modern infrastructure.
            </p>
            <div className="flex flex-col items-center gap-md mt-10">
              <Link href="/auth/signup" className="bg-acid-lime text-primary-foreground px-xl py-sm rounded-lg font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--theme-lime-rgb),0.6)] transition-all duration-500 flex items-center gap-xs transform hover:-translate-y-1">
                Deploy Sentinel <ArrowRight className="w-4 h-4" />
              </Link>
              {/* Copy Command Section - Fixed Visibility */}
              <div className="bg-zinc-950 rounded-xl p-1 mt-4 flex items-center shadow-2xl border border-white/10 group overflow-hidden">
                <div className="px-md py-sm font-code-md text-sm md:text-base flex items-center gap-sm">
                  <span className="text-acid-lime font-bold select-none">❯</span>
                  <span className="text-zinc-100 font-medium selection:bg-acid-lime/30">{START_COMMAND}</span>
                </div>
                <button 
                  onClick={copyStart} 
                  className="bg-zinc-900 rounded-lg ml-2 px-3 py-2 flex items-center justify-center text-zinc-400 hover:text-acid-lime hover:bg-zinc-800 transition-all border border-white/5 mr-1" 
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>

          {/* Visual Schematic */}
          <section className="w-full max-w-6xl mx-auto relative py-xl mt-8">
            <div className="glass-panel micro-border-lime rounded-3xl p-12 relative overflow-hidden shadow-[0_0_50px_rgba(217,255,0,0.05)] bg-[#0d0d15]/80">
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
                <path className="circuit-line" d="M 500,200 L 250,200 L 250,100 L 100,100" fill="none"></path>
                <path className="circuit-line" d="M 500,200 L 750,200 L 750,300 L 900,300" fill="none" style={{ animationDelay: "-1s" }}></path>
                <path className="circuit-line" d="M 500,200 L 500,50 L 750,50 L 900,50" fill="none" style={{ animationDelay: "-0.5s" }}></path>
                <circle cx="500" cy="200" fill="#d9ff00" r="4"></circle>
                <circle cx="100" cy="100" fill="#d9ff00" r="4"></circle>
                <circle cx="900" cy="300" fill="#d9ff00" r="4"></circle>
                <circle cx="900" cy="50" fill="#d9ff00" r="4"></circle>
              </svg>
              <div className="flex flex-col lg:flex-row justify-center items-center gap-16 relative z-10">
                {/* Center Node */}
                <div className="bg-surface-container-highest border-2 border-acid-lime rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(217,255,0,0.2)] w-56 relative group hover:scale-105 transition-transform duration-500">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d0d15] px-2 text-[10px] text-acid-lime font-code-md tracking-[0.3em] font-black uppercase">Sentinel_Core</div>
                  <div className="w-16 h-16 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/30 group-hover:bg-acid-lime/20 transition-colors">
                    <ShieldCheck className="text-acid-lime w-8 h-8" />
                  </div>
                  <span className="font-black text-foreground text-2xl uppercase tracking-tighter italic">StillUp</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 z-10 w-full lg:w-auto">
                  {/* Node 1 */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center border border-border/10">
                        <Database className="text-acid-lime w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-tight">Postgres Backup</div>
                        <div className="text-[10px] text-muted-foreground font-code-md uppercase tracking-widest">Cron_Daily</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/5 px-3 py-1.5 rounded-lg border border-acid-lime/10 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-acid-lime animate-pulse"></span> HEALTHY
                    </div>
                  </div>

                  {/* Node 2 - Tunnel Node */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group bg-acid-lime/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20">
                        <Lock className="text-acid-lime w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-tight">HQ VPN Tunnel</div>
                        <div className="text-[10px] text-acid-lime font-code-md uppercase tracking-widest">WireGuard</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/10 px-3 py-1.5 rounded-lg border border-acid-lime/20 w-fit">
                      <Wifi className="w-3 h-3" /> 12ms LATENCY
                    </div>
                  </div>

                  {/* Node 3 - ReplayGuard Node */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group border-acid-lime/20 bg-acid-lime/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center border border-border/10">
                        <Zap className="text-acid-lime w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black uppercase tracking-tight">Payment Retry</div>
                        <div className="text-[10px] text-acid-lime font-code-md uppercase tracking-widest">ReplayGuard</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/10 px-3 py-1.5 rounded-lg border border-acid-lime/20 w-fit">
                      <ShieldCheck className="w-3 h-3" /> IDEMPOTENT
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure Safety Section */}
          <section className="w-full py-24 relative overflow-hidden">
            <div className="text-center mb-20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime mb-4 italic">Next-Gen Observability</h2>
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Meet the <span className="glow-lime">Sentinel</span>.</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mt-4 italic">Infrastructure Safety Suite</p>
              <p className="text-muted-foreground mt-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Standard monitoring tells you if a service is running. StillUp Sentinel provides deep, high-fidelity safety for your global encrypted networks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
              <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                  <ShieldAlert className="text-acid-lime w-7 h-7" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Silent Failure Detection</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most VPNs and Tunnels fail silently—the process stays UP while data is stuck. Sentinel detects handshake stagnation and latency spikes before they break your access.
                </p>
              </div>

              <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                  <Lock className="text-acid-lime w-7 h-7" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Credential & Key Safety</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stale keys and expiring certificates are the #1 cause of sudden infrastructure lockout. We track key age and certificate validity, alerting you weeks before expiry.
                </p>
              </div>

              <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                  <Activity className="text-acid-lime w-7 h-7" />
                </div>
                <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Network Pulse Analytics</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  See the heartbeat of your secure network. High-fidelity latency tracking and handshake metrics give you a "Single Pane of Glass" view into your global infrastructure health.
                </p>
              </div>
            </div>
          </section>

          {/* ReplayGuard Deep Dive */}
          <section className="w-full py-24 relative">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acid-lime/20 bg-acid-lime/5 backdrop-blur text-[10px] font-black italic text-acid-lime uppercase tracking-widest">
                  Exactly-Once Semantics
                </div>
                <h3 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">
                  Execution <br/> <span className="glow-lime">Memory</span>.
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  Autonomous agents fail. It’s inevitable. But retrying a failed agent job shouldn't charge your customer twice or corrupt your database.
                </p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-acid-lime" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight italic text-sm">Intercept Side Effects</h4>
                      <p className="text-sm text-muted-foreground mt-1">Automatically pause and verify dangerous actions (Payments, Emails, DB Writes) before they execute.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-acid-lime" />
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-tight italic text-sm">Result Replay</h4>
                      <p className="text-sm text-muted-foreground mt-1">StillUp remembers the outcome of successful steps. On retry, we skip the action and replay the original result.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <Link href="/dashboard/guards" className="text-acid-lime font-black uppercase tracking-widest text-xs flex items-center gap-2 group hover:gap-4 transition-all">
                    Explore Execution Memory <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual Timeline Component */}
              <div className="relative">
                <div className="absolute -inset-4 bg-acid-lime/5 blur-3xl rounded-full opacity-50 animate-pulse"></div>
                <div className="glass-panel rounded-[3rem] border-border/10 p-8 shadow-2xl relative bg-[#0a0a0f]/90 overflow-hidden group">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-destructive animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Retry_Attempt_02</span>
                    </div>
                    <span className="text-[10px] font-code-md text-acid-lime/40">JOB_ID: agent-992</span>
                  </div>

                  <div className="space-y-4">
                    {/* Step 1: Completed */}
                    <div className="p-5 rounded-2xl bg-foreground/[0.03] border border-border/5 flex items-center justify-between opacity-50 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-acid-lime/20 flex items-center justify-center text-acid-lime border border-acid-lime/30">
                          <Database className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight">Auth Check</span>
                      </div>
                      <CheckCircle className="w-4 h-4 text-acid-lime" />
                    </div>

                    {/* Step 2: INTERCEPTED / SKIPPED */}
                    <div className="p-5 rounded-2xl bg-acid-lime/5 border-2 border-acid-lime/20 flex items-center justify-between shadow-[0_0_30px_rgba(var(--theme-lime-rgb),0.1)] relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-5 scale-150"><Zap className="w-12 h-12 text-acid-lime" /></div>
                       <div className="flex items-center gap-4 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-acid-lime flex items-center justify-center text-primary-foreground">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tight">Charge_Customer</span>
                          <span className="text-[9px] font-black text-acid-lime uppercase italic">Intercepted: Already Paid</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-acid-lime/10 border border-acid-lime/20 text-[9px] font-black uppercase tracking-widest text-acid-lime italic">
                        SKIPPED
                      </div>
                    </div>

                    {/* Step 3: PENDING */}
                    <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/5 flex items-center justify-between border-dashed">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-muted-foreground/40">
                          <Bell className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-tight text-muted-foreground/40">Send Receipt</span>
                      </div>
                      <RefreshCw className="w-4 h-4 text-muted-foreground/20 animate-spin" />
                    </div>
                  </div>

                  <div className="mt-10 p-6 rounded-3xl bg-acid-lime/[0.02] border border-acid-lime/10 space-y-4">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-acid-lime" />
                       <span className="text-[10px] font-black uppercase tracking-widest italic">Sentinel Insight</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                      "StillUp detected a successful payment fingerprint in <span className="text-acid-lime">Attempt_01</span>. Execution halted to prevent double-spend. Replaying cached receipt."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-md w-full mt-xl">
            {[
              { icon: <Heart className="w-5 h-5" />, title: 'Heartbeat Sentinel.', desc: 'Zero-config monitoring for Crons and Backups. Pulse metrics from any script with our global CLI.' },
              { icon: <ShieldCheck className="w-5 h-5" />, title: 'ReplayGuard™ Safety.', desc: 'The first "Exactly-Once" engine for background jobs. Prevent double payments and emails during retries.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Sentinel Alerts.', desc: 'Deep-link alerts via Slack or Discord that take you directly to the root cause of a silent tunnel failure.' }
            ].map((f, i) => (
              <div 
                key={i}
                className={`glass-panel rounded-xl p-lg flex flex-col gap-sm hover:micro-border-lime transition-all cursor-pointer ${activeFeature === i ? 'micro-border-lime' : 'border border-outline-variant/20'}`}
                onClick={() => setActiveFeature(i)}
              >
                
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant/30 mb-sm">
                  <span className={`${activeFeature === i ? 'text-acid-lime' : 'text-foreground'}`}>{f.icon}</span>
                </div>
                <h3 className="text-headline-md font-headline-md text-foreground">{f.title}</h3>
                <p className="text-body-md font-body-md text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </section>
        </main>

        <section className="w-full max-w-7xl mx-auto px-margin py-xl flex flex-col items-center gap-lg">
          <h2 className="text-headline-lg font-headline-lg text-foreground text-center">Loved by DevOps Engineers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
            <div className="glass-panel rounded-xl p-lg flex flex-col justify-between gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
              <p className="text-body-lg font-body-lg text-foreground italic">“StillUp caught a silent backup failure that would have cost us weeks of data. The memory feature is a game changer.”</p>
              <div className="text-label-sm text-muted-foreground">— Lead SRE @ TechCorp</div>
            </div>
            <div className="glass-panel rounded-xl p-lg flex flex-col justify-between gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
              <p className="text-body-lg font-body-lg text-foreground italic">“Finally, a monitoring tool that doesn't just scream at me, but actually helps me understand why things are failing.”</p>
              <div className="text-label-sm text-muted-foreground">— Senior Backend Engineer</div>
            </div>
            <div className="glass-panel rounded-xl p-lg flex flex-col justify-between gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
              <p className="text-body-lg font-body-lg text-foreground italic">“The zero-agent approach makes it so easy to deploy. We had 50 crons monitored in less than 10 minutes.”</p>
              <div className="text-label-sm text-muted-foreground">— Infrastructure Lead</div>
            </div>
          </div>
        </section>

        <section className="w-full max-w-3xl mx-auto px-margin py-xl flex flex-col gap-lg">
          <h2 className="text-headline-lg font-headline-lg text-foreground text-center md:text-left">Frequently Asked Questions</h2>
          <div className="flex flex-col border-t border-border/20">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-border/20 flex flex-col cursor-pointer group" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="py-md flex items-center justify-between">
                  <span className="text-body-lg font-headline-md text-foreground group-hover:text-primary transition-colors">{faq.q}</span>
                  <ChevronDown className="text-muted-foreground transition-transform w-5 h-5" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }} />
                </div>
                {openFaq === i && (
                  <div className="pb-md text-muted-foreground text-body-md font-body-md">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }
