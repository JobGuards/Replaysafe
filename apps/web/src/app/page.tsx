"use client";

import Link from "next/link";
import { useState } from "react";
import { NewNav } from "@/components/NewNav";
import { Footer } from "@/components/Footer";
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
  ShieldAlert
} from "lucide-react";

const START_COMMAND = "curl -fsS https://stillup.io/hb/your-token";

export default function LandingPage() {
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
    { q: "What is StillUp?", a: "StillUp is a heartbeat monitoring service that ensures your backups, cron jobs, and scheduled tasks actually run. If they don't, we alert you immediately." },
    { q: "How do I add it to my script?", a: "Just add a simple curl command at the end of your script. If the curl doesn't happen, we know something went wrong." },
    { q: "Can I report failures explicitly?", a: "Yes! You can POST to our failure endpoint with error logs and exit codes, and we'll record exactly what happened." },
    { q: "What is 'Execution Memory'?", a: "Unlike other tools, StillUp remembers past failures. We help you find patterns and suggest fixes based on what worked last time." },
    { q: "Does it work with my existing tools?", a: "StillUp works anywhere curl works. We also integrate with Slack, Discord, and PagerDuty for alerting." },
  ];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div className="font-body-md text-body-md antialiased min-h-screen flex flex-col relative bg-background bg-tech-grid overflow-x-hidden text-on-surface z-0">
        {/* Dynamic Background Elements */}
        <div className="radial-glow-hero"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="particle" style={{ left: '10%', animationDelay: '0s', height: '150px' }}></div>
          <div className="particle" style={{ left: '30%', animationDelay: '2s', height: '80px' }}></div>
          <div className="particle" style={{ left: '70%', animationDelay: '1.5s', height: '200px' }}></div>
          <div className="particle" style={{ left: '85%', animationDelay: '0.5s', height: '120px' }}></div>
        </div>
        
        {/* TopNavBar */}
        <NewNav userEmail={null} />

        <main className="flex-grow pt-32 pb-xl px-margin max-w-7xl mx-auto w-full flex flex-col items-center gap-xl relative z-10">
          {/* Hero Section */}
          <section className="text-center flex flex-col items-center gap-lg max-w-4xl mx-auto mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/30 bg-card/50 backdrop-blur text-xs font-code-md text-muted-foreground mb-4">
              <span className="w-2 h-2 rounded-full bg-acid-lime animate-pulse"></span>
              <span className="tracking-widest uppercase text-[10px]">System_Status: Operational</span>
            </div>
            <h1 className="text-headline-xl font-headline-xl text-foreground uppercase tracking-tight">
              If it didn't run, <br/> <span className="glow-lime font-black">we tell you</span>.
            </h1>
            <p className="text-body-lg font-body-lg text-muted-foreground max-w-2xl mt-2">
              Heartbeat monitoring with memory. Track your backups, crons, and jobs. If they fail, we remember why and help you fix them.
            </p>
            <div className="flex flex-col items-center gap-md mt-6">
              <Link href="/dashboard" className="bg-acid-lime text-primary-foreground px-xl py-sm rounded-lg font-bold shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--theme-lime-rgb),0.6)] hover:opacity-90 transition-all duration-300 flex items-center gap-xs transform hover:-translate-y-1">
                Start Monitoring <ArrowRight className="w-4 h-4" />
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
            <div className="glass-panel micro-border-lime rounded-2xl p-lg relative overflow-hidden shadow-[0_0_50px_rgba(217,255,0,0.05)] bg-[#0d0d15]/80">
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none" viewBox="0 0 1000 400" xmlns="http://www.w3.org/2000/svg">
                <path className="circuit-line" d="M 500,200 L 250,200 L 250,100 L 100,100" fill="none"></path>
                <path className="circuit-line" d="M 500,200 L 750,200 L 750,300 L 900,300" fill="none" style={{ animationDelay: "-1s" }}></path>
                <path className="circuit-line" d="M 500,200 L 500,50 L 750,50 L 900,50" fill="none" style={{ animationDelay: "-0.5s" }}></path>
                <circle cx="500" cy="200" fill="#d9ff00" r="4"></circle>
                <circle cx="100" cy="100" fill="#d9ff00" r="4"></circle>
                <circle cx="900" cy="300" fill="#d9ff00" r="4"></circle>
                <circle cx="900" cy="50" fill="#d9ff00" r="4"></circle>
              </svg>
              <div className="flex flex-col md:flex-row justify-center items-center gap-xl relative z-10">
                {/* Center Node */}
                <div className="bg-surface-container-highest border-2 border-acid-lime rounded-xl p-md flex flex-col items-center gap-sm shadow-[0_0_40px_rgba(217,255,0,0.2)] w-48 relative group hover:scale-105 transition-transform duration-300">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0d0d15] px-2 text-[10px] text-acid-lime font-code-md tracking-widest uppercase">Center</div>
                  <div className="w-12 h-12 rounded-lg bg-acid-lime/10 flex items-center justify-center border border-acid-lime/30 group-hover:bg-acid-lime/20 transition-colors">
                    <Activity className="text-acid-lime w-6 h-6" />
                  </div>
                  <span className="font-bold text-on-surface font-headline-md tracking-tight">StillUp Hub</span>
                  <div className="text-[10px] text-on-surface-variant font-code-md opacity-60">MONITOR_CORE</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg z-10 w-full md:w-auto">
                  {/* Node 1 */}
                  <div className="glass-panel rounded-xl p-md flex flex-col gap-sm border-outline-variant/30 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/50">
                        <Database className="text-primary w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">DB Backup</div>
                        <div className="text-[10px] text-muted-foreground font-code-md uppercase">Cron_01</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-code-md text-acid-lime flex items-center gap-2 bg-acid-lime/5 px-2 py-1 rounded border border-acid-lime/10 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-acid-lime animate-pulse shadow-[0_0_5px_#d9ff00]"></span> ACTIVE
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div className="glass-panel rounded-xl p-md flex flex-col gap-sm border-outline-variant/30 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tertiary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/50">
                        <RefreshCw className="text-tertiary w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Data Sync</div>
                        <div className="text-[10px] text-muted-foreground font-code-md uppercase">Job_02</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-code-md text-tertiary-fixed flex items-center gap-2 bg-tertiary/5 px-2 py-1 rounded border border-tertiary/10 w-fit">
                      <RefreshCw className="w-3 h-3 animate-spin" /> SYNCING...
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div className="glass-panel rounded-xl p-md flex flex-col gap-sm border-outline-variant/30 hover:border-acid-lime/50 transition-all hover:shadow-[0_0_20px_rgba(217,255,0,0.1)] relative overflow-hidden group hidden md:flex">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary-fixed to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center border border-outline-variant/50">
                        <Bell className="text-secondary-fixed w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">Alert Engine</div>
                        <div className="text-[10px] text-muted-foreground font-code-md uppercase">Svc_03</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-code-md text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded border border-border/30 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-border"></span> IDLE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-md w-full mt-xl">
            {[
              { icon: <Heart className="w-5 h-5" />, title: 'Heartbeat Monitoring.', desc: 'Zero-config monitoring. Just add a curl to your script and we do the rest.' },
              { icon: <History className="w-5 h-5" />, title: 'Execution Memory.', desc: 'We remember every failure. See patterns, trends, and previous resolutions at a glance.' },
              { icon: <Zap className="w-5 h-5" />, title: 'Smart Alerting.', desc: 'Get notified via Slack, Discord, or Email before your users notice anything is wrong.' }
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
      </div>

      <Footer />
    </>
  );
}
