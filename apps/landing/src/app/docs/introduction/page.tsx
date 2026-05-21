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
          Replaysafe is the industry-leading **Infrastructure Sentinel**—a high-fidelity monitoring platform designed for Crons, Backups, and Secure Network Tunnels.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic">Why Sentinel?</h3>
          <p className="mb-10 leading-relaxed text-muted-foreground">
            Replaysafe solves the **"Silent Failure"** problem. Services that are technically UP but functionally degraded—like a stale VPN tunnel or a hanging cron—are detected instantly by our Sentinel engine.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureItem icon={<CheckCircle2 className="w-5 h-5" />} title="Tunnel Handshake Tracking" />
            <FeatureItem icon={<Shield className="w-5 h-5" />} title="Key Expiry Sentinel" />
            <FeatureItem icon={<Search className="w-5 h-5" />} title="Silent Failure Detection" />
            <FeatureItem icon={<Zap className="w-5 h-5" />} title="Real-time Pulse Analytics" />
          </div>
        </section>

        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">The Three Sentinels</h2>
          <div className="grid gap-16">
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">01. Heartbeat Sentinel</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                The standard for Crons and Backups. We monitor the regularity of your jobs and detect patterns of failure before they become outages.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">02. Infrastructure Sentinel</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                Specifically for **WireGuard, SSH, and VPNs**. We monitor handshake age and network latency without ever intercepting your private traffic.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">03. Security Sentinel</h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                Protecting your access. We track key rotations, certificate validity, and identify suspicious infrastructure shifts in real-time.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic" id="quick-start">Quick Start</h2>
          <p className="leading-relaxed text-muted-foreground">
            Replaysafe Sentinel operates on a **Telemetry Push** model. Deploy a sentinel with a single command to start tracking health immediately.
          </p>
          <div className="group relative p-10 bg-foreground/[0.02] rounded-[2.5rem] border border-border/10 hover:border-acid-lime/30 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-acid-lime/20"></div>
            <code className="text-sm font-mono text-acid-lime block mb-4 selection:bg-acid-lime/30">
              # Monitoring a heartbeat<br/>
              curl -fsS {`${(process.env.NEXT_PUBLIC_API_URL || 'https://api.your-domain.com').replace(/\/api$/, '')}/hb/your-token`}
            </code>
            <code className="text-sm font-mono text-foreground/40 block selection:bg-acid-lime/30">
              # Monitoring a tunnel (Tunnelight Engine)<br/>
              sentinel-cli tunnel --id wg0 --token your-token
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
