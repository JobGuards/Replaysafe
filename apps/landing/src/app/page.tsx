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
  Wifi,
  Github
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "";
  const INSTALL_COMMAND = "npm install @replaysafe/guard-sdk";
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  async function copyStart() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this command:", INSTALL_COMMAND);
    }
  }

  const faqs = [
    { q: "What is Replaysafe?", a: "Replaysafe is a reliability platform that combines heartbeat monitoring for infrastructure with ReplayGuard for background job safety. We ensure your backups run and your job retries are idempotent." },
    { q: "What is ReplayGuard?", a: "ReplayGuard makes retrying failed jobs safe. It tracks side effects (payments, emails) using cryptographic fingerprints to prevent duplicate execution during retries." },
    { q: "How does it monitor Tunnels?", a: "We track handshake age and latency for WireGuard, SSH, and OpenVPN. If your tunnel degrades or keys go stale, we detect it without intercepting traffic." },
    { q: "Can I report failures explicitly?", a: "Yes! You can use our CLI or SDK to report failures, measure latency, and guard side effects with replay-safe deduplication - preventing duplicate actions even across aggressive retries." },
    { q: "What is 'Execution Memory'?", a: "Replaysafe remembers past failures and successful side effects. We help you find patterns and ensure that retrying a job never charges a customer twice." },
    { q: "Does it work with my existing orchestration framework?", a: "Yes - ReplayGuard ships with named adapters for LangGraph, CrewAI, Inngest, n8n, and Airflow. Each is a drop-in wrapper over the same safety engine. No framework lock-in, no rewrites. If you use a custom runner or any other framework, the generic guard.wrap() method works anywhere." },
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
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acid-lime/20 bg-acid-lime/5 backdrop-blur text-xs font-code-md text-acid-lime shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.1)]">
              <span className="w-2 h-2 rounded-full bg-acid-lime animate-pulse"></span>
              <span className="tracking-[0.2em] uppercase text-[10px] font-black italic">Replay-Safe Active</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur text-xs font-code-md text-muted-foreground">
              <span className="tracking-[0.2em] uppercase text-[10px] font-black italic">Works With Any Framework</span>
            </div>
          </div>
          <h1 className="text-headline-xl font-headline-xl text-foreground uppercase tracking-tight">
            The <span className="glow-lime font-black">Safety Layer</span><br />
            <span className="text-foreground/40 font-black italic">For AI Agents.</span>
          </h1>
          <p className="text-body-lg font-body-lg text-muted-foreground max-w-2xl mt-2">
            When AI agents fail and retry, they repeat every action they already took - double charges, duplicate emails, redundant API calls. ReplayGuard intercepts duplicate side effects before they happen.
          </p>
          <div className="flex flex-col items-center gap-lg mt-15">
            <a href="https://github.com/JobGuards/Replaysafe" className="bg-acid-lime text-primary-foreground px-sm py-sm rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--theme-lime-rgb),0.6)] transition-all duration-500 flex items-center gap-xs transform hover:-translate-y-1">
              <Github className="w-8 h-8" />
            </a>
            {/* Install Command */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-zinc-950 rounded-xl p-1 flex items-center shadow-2xl border border-white/10 group overflow-hidden">
                <div className="px-md py-sm font-code-md text-sm md:text-base flex items-center gap-sm">
                  <span className="text-acid-lime font-bold select-none">❯</span>
                  <span className="text-zinc-100 font-medium selection:bg-acid-lime/30">{INSTALL_COMMAND}</span>
                </div>
                <button
                  onClick={copyStart}
                  className="bg-zinc-900 rounded-lg ml-2 px-3 py-2 flex items-center justify-center text-zinc-400 hover:text-acid-lime hover:bg-zinc-800 transition-all border border-white/5 mr-1"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40 italic">⚡ Open source · Self-hostable · AGPL-3.0</span>
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
                <span className="font-black text-foreground text-2xl uppercase tracking-tighter italic">Replaysafe</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 z-10 w-full lg:w-auto">
                {/* Node 1 - LangGraph Agent */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center border border-border/10">
                      <Activity className="text-acid-lime w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">LangGraph Agent</div>
                      <div className="text-[10px] text-muted-foreground font-code-md uppercase tracking-widest">Retry_Attempt_02</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/5 px-3 py-1.5 rounded-lg border border-acid-lime/10 w-fit">
                    <ShieldCheck className="w-3 h-3" /> DEDUPED
                  </div>
                </div>

                {/* Node 2 - Stripe Charge */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group bg-acid-lime/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20">
                      <Zap className="text-acid-lime w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">Stripe Charge</div>
                      <div className="text-[10px] text-acid-lime font-code-md uppercase tracking-widest">ReplayGuard</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/10 px-3 py-1.5 rounded-lg border border-acid-lime/20 w-fit">
                    <ShieldCheck className="w-3 h-3" /> SKIPPED
                  </div>
                </div>

                {/* Node 3 - LLM Call */}
                <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-border/10 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group border-acid-lime/20 bg-acid-lime/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-foreground/[0.03] flex items-center justify-center border border-border/10">
                      <Database className="text-acid-lime w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-tight">LLM Call</div>
                      <div className="text-[10px] text-acid-lime font-code-md uppercase tracking-widest">guard.ai()</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-acid-lime bg-acid-lime/10 px-3 py-1.5 rounded-lg border border-acid-lime/20 w-fit">
                    <Check className="w-3 h-3" /> CACHED
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ReplayGuard Deep Dive - PRIMARY SECTION */}
        <section className="w-full py-24 relative">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acid-lime/20 bg-acid-lime/5 backdrop-blur text-[10px] font-black italic text-acid-lime uppercase tracking-widest">
                Replay-Safe Execution
              </div>
              <h3 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">
                Execution <br /> <span className="glow-lime">Memory</span>.
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
                    <p className="text-sm text-muted-foreground mt-1">Replaysafe remembers the outcome of successful steps. On retry, we skip the action and replay the original result.</p>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <a href={`${dashboardUrl}/dashboard/guards`} className="text-acid-lime font-black uppercase tracking-widest text-xs flex items-center gap-2 group hover:gap-4 transition-all">
                  Explore Execution Memory <ArrowRight className="w-4 h-4" />
                </a>
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
                    "Replaysafe detected a successful payment fingerprint in <span className="text-acid-lime">Attempt_01</span>. Execution halted to prevent double-spend. Replaying cached receipt."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-24 relative overflow-hidden">
          {/* Works With - Framework Compatibility Strip */}
          <div className="mt-16 w-full mx-auto">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 mb-6 italic text-center">Drop-in safety proxy for</p>
            <div className="flex flex-wrap justify-center items-center gap-3">
              {[
                { name: 'LangGraph', color: '#1a73e8', icon: '⬡', href: '/docs/integrations/langgraph' },
                { name: 'CrewAI', color: '#00b894', icon: '⬡', href: '/docs/integrations/crewai' },
                { name: 'Inngest', color: '#e8821a', icon: '⚡', href: '/docs/integrations/inngest' },
                { name: 'n8n', color: '#ea4b71', icon: '◆', href: '/docs/integrations/n8n' },
                { name: 'Airflow', color: '#017cee', icon: '◈', href: '/docs/integrations/langgraph' },
                { name: 'Any Framework', color: '#4a9eff', icon: '⬟', href: '/docs/integrations/README' },
              ].map((fw) => (
                <Link
                  key={fw.name}
                  href={fw.href}
                  className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] hover:border-acid-lime/30 hover:bg-acid-lime/5 transition-all duration-300 cursor-pointer"
                >
                  <span className="text-sm" style={{ color: fw.color }}>{fw.icon}</span>
                  <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wider">{fw.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Code Comparison: Before / After */}
          <div className="mt-12 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 text-left">
            {/* Before */}
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-destructive/10 bg-destructive/10">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-destructive/70">Without ReplayGuard</span>
              </div>
              <pre className="text-xs font-mono text-muted-foreground p-4 overflow-x-auto leading-relaxed"><code>{`// LangGraph node - UNSAFE on retry
async function chargeNode(state) {
  // ⚠️ On retry: charges TWICE
  const charge = await stripe
    .charges.create({
      amount: state.amount,
      customer: state.customerId,
    });
  return { chargeId: charge.id };
}`}</code></pre>
            </div>
            {/* After */}
            <div className="rounded-2xl border border-acid-lime/20 bg-acid-lime/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-acid-lime/10 bg-acid-lime/10">
                <span className="w-2 h-2 rounded-full bg-acid-lime animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-acid-lime/70">With ReplayGuard</span>
              </div>
              <pre className="text-xs font-mono text-muted-foreground p-4 overflow-x-auto leading-relaxed"><code>{`// LangGraph node - SAFE on retry
async function chargeNode(state, guard) {
  // ✅ On retry: replays cached result
  const charge = await guard.langGraph(
    'stripe-charge',
    { amount: state.amount },
    () => stripe.charges.create({
      amount: state.amount,
      customer: state.customerId,
    })
  );
  return { chargeId: charge.id };
}`}</code></pre>
            </div>
          </div>
        </section>

        {/* Sentinel / Infrastructure Telemetry - SUPPORTING SECTION */}
        <section className="w-full py-24 relative overflow-hidden">
          <div className="text-center mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime mb-4 italic">Visibility for the Replay Engine</h2>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Infrastructure <span className="glow-lime">Telemetry</span>.</h3>
            <p className="text-muted-foreground mt-8 max-w-2xl mx-auto text-lg leading-relaxed">
              Know when the infrastructure your agents depend on starts to degrade - before a retry turns into a disaster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-6">
            <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                <Heart className="text-acid-lime w-7 h-7" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Heartbeat Monitoring</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Zero-config cron and job monitoring. If your background job stops reporting, Replaysafe fires an alert before any agent retries into a broken state.
              </p>
            </div>

            <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                <ShieldAlert className="text-acid-lime w-7 h-7" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Silent Tunnel Detection</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                WireGuard and SSH tunnels fail silently - the process stays UP while data stops flowing. Sentinel detects stale handshakes and latency spikes before they break autonomous access.
              </p>
            </div>

            <div className="glass-panel p-10 rounded-[2.5rem] border-border/10 bg-card/30 backdrop-blur-xl group hover:border-acid-lime/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 mb-8 group-hover:scale-110 transition-transform">
                <Zap className="text-acid-lime w-7 h-7" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight italic mb-4">Failure Pattern Intelligence</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Replaysafe tracks recurring failure windows, health score trends, and cascade incidents - giving agents and engineers actionable context, not just raw alerts.
              </p>
            </div>
          </div>
        </section>
      </main>

      <section className="w-full max-w-7xl mx-auto px-margin py-xl flex flex-col items-center gap-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-acid-lime/20 bg-acid-lime/5 text-[10px] font-black italic text-acid-lime uppercase tracking-widest mb-2">
          Early Access
        </div>
        <h2 className="text-headline-lg font-headline-lg text-foreground text-center">Built for the Problems You're Already Hitting</h2>
        <p className="text-muted-foreground text-center max-w-2xl text-sm leading-relaxed">
          Replaysafe is in early access. We're working directly with engineering teams who are deploying AI agents in production and hitting the duplicate side-effect problem. If that's you, we want to hear from you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full mt-4">
          <div className="glass-panel rounded-xl p-lg flex flex-col gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20">
              <Zap className="text-acid-lime w-5 h-5" />
            </div>
            <h4 className="font-black uppercase tracking-tight italic text-sm">The Double-Charge Problem</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Agent charges a customer, DB write fails, agent retries - and charges again. ReplayGuard fingerprints the charge and skips execution on retry. The customer is never billed twice.</p>
          </div>
          <div className="glass-panel rounded-xl p-lg flex flex-col gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20">
              <Database className="text-acid-lime w-5 h-5" />
            </div>
            <h4 className="font-black uppercase tracking-tight italic text-sm">The LLM Retry Tax</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Every agent retry re-runs every LLM call from scratch. <span className="font-mono text-acid-lime/80">guard.ai()</span> caches completions - if the same call already ran, the cached result is returned. No second API bill.</p>
          </div>
          <div className="glass-panel rounded-xl p-lg flex flex-col gap-md border border-border/20 hover:border-acid-lime/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20">
              <RefreshCw className="text-acid-lime w-5 h-5" />
            </div>
            <h4 className="font-black uppercase tracking-tight italic text-sm">The 50-Step Restart Problem</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">Agent runs 50 tool calls, fails at step 48, retries from scratch. ReplayGuard skips steps 1–47, resumes at 48. No duplicate side effects. No wasted compute.</p>
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
