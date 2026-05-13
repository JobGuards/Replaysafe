'use client'

import React from 'react'
import { CheckCircle2, Zap, Shield, Search, ArrowRight } from 'lucide-react'
import { DocLayout } from '@/components/docs/DocLayout'

export default function IntroDoc() {
  return (
    <DocLayout 
      title="Introduction" 
      subtitle="The Vision" 
      category="Getting Started"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          StillUp is the industry's first **Replay-Safe Execution Layer** for AI agents, background jobs, and autonomous systems.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic">Why StillUp?</h3>
          <p className="mb-10 leading-relaxed text-muted-foreground">
            StillUp solves the **"Dangerous Retry"** problem. When an AI agent or background job fails and retries, it often re-executes actions that already succeeded. StillUp provides exactly-once semantics to prevent double payments, duplicate emails, and corrupted state.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureItem icon={<CheckCircle2 className="w-5 h-5" />} title="Exactly-Once Execution" />
            <FeatureItem icon={<Shield className="w-5 h-5" />} title="Idempotent Side Effects" />
            <FeatureItem icon={<Search className="w-5 h-5" />} title="Execution Memory" />
            <FeatureItem icon={<Zap className="w-5 h-5" />} title="Agent Retry Safety" />
          </div>
        </section>

        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Core Primitives</h2>
          <div className="grid gap-16">
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">01. ReplayGuard™</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                The core safety engine. We track side effects using cryptographic fingerprints. If a job retries, StillUp intercepts duplicate actions and replays the original successful result.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">02. Execution Memory</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                StillUp remembers every side effect and state change your systems make. It acts as a shared brain, ensuring idempotency even for third-party APIs that don't support it natively.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">03. Infrastructure Telemetry</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                Visibility for the replay engine. We monitor the health of the underlying services your agents depend on (Crons, VPN Tunnels, Webhooks) before a retry turns into a disaster.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic" id="quick-start">Quick Start</h2>
          <p className="leading-relaxed text-muted-foreground">
            StillUp Sentinel operates on a **Telemetry Push** model. Deploy a sentinel with a single command to start tracking health immediately.
          </p>
          <div className="group relative p-10 bg-foreground/[0.02] rounded-[2.5rem] border border-border/10 hover:border-acid-lime/30 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-acid-lime/20"></div>
            <code className="text-sm font-mono text-acid-lime block mb-4 selection:bg-acid-lime/30">
              # Monitoring a heartbeat<br/>
              curl -fsS https://stillup.io/hb/your-token
            </code>
            <code className="text-sm font-mono text-foreground/40 block selection:bg-acid-lime/30">
              # Monitoring a tunnel (Tunnelight Engine)<br/>
              stillup tunnel monitor your-token
            </code>
          </div>
        </section>
      </div>
    </DocLayout>
  )
}

function FeatureItem({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-acid-lime">{icon}</div>
      <span className="text-sm font-bold text-foreground/80">{title}</span>
    </div>
  )
}
