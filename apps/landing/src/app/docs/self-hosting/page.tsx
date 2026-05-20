'use client'

import React from 'react'
import { Server, Shield, Zap, Globe, Cpu, Lock, CheckCircle2 } from 'lucide-react'
import { DocLayout } from '@/components/docs/DocLayout'

export default function SelfHostingDoc() {
  return (
    <DocLayout 
      title="Self-Hosted Guide" 
      subtitle="Sovereign Infrastructure" 
      category="Infrastructure"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80 font-medium">
          StillUp is built for the **Sovereign Homelab** and the **Next Generation of Autonomous Agents**. While enterprise teams use us for financial transaction safety, self-hosters use us to build more reliable AI agents and keep their automated lives from falling apart.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02] space-y-8">
          <h3 className="text-2xl font-black uppercase tracking-tight text-foreground italic flex items-center gap-3">
            <Server className="w-6 h-6 text-acid-lime" />
            Reliability Use Cases
          </h3>
          <p className="leading-relaxed text-muted-foreground">
            Automation on consumer hardware and non-deterministic AI agents are prone to "Silent Failures"—reboots, state drift, and execution loops. StillUp provides the "Safety Primitives" to handle these gracefully.
          </p>
          
          <div className="grid gap-8 pt-4">
             <HomelabUseBox 
               title="Smart Home Safety" 
               description="If a 'Lock Doors' or 'Turn Off Stove' command fails halfway through a Wi-Fi blink, StillUp ensures it reverts to a safe state."
             />
             <HomelabUseBox 
               title="Autonomous Agent Reliability" 
               description="Prevent AI agents from repeating expensive or dangerous actions when they restart after a non-deterministic failure."
             />
             <HomelabUseBox 
               title="Media Download Stacks" 
               description="Prevent automated downloaders (Radarr/Sonarr) from looping or hammering external APIs during network degradation."
             />
             <HomelabUseBox 
               title="Local AI Stability" 
               description="Prevent redundant local LLM loops (Ollama) from pinning your GPU at 100% due to accidental script recursion."
             />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">One-Click Deployment</h2>
          <p className="leading-relaxed text-muted-foreground">
            StillUp is 100% locally hostable. No telemetry, no external cloud dependencies, and 100% local data sovereignty.
          </p>
          <div className="group relative p-10 bg-foreground/[0.02] rounded-[2.5rem] border border-border/10 hover:border-acid-lime/30 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-acid-lime/20"></div>
            <pre className="text-xs font-mono text-acid-lime leading-relaxed overflow-x-auto">
{`version: "3.8"
services:
  stillup-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=stillup
      - POSTGRES_PASSWORD=password
    volumes:
      - ./data/db:/var/lib/postgresql/data

  stillup-app:
    image: stillup/stillup:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@stillup-db:5432/stillup
    depends_on:
      - stillup-db`}
            </pre>
          </div>
        </section>

        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Privacy & Sovereignty</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <SovereignFeature icon={<Lock className="w-5 h-5" />} title="Zero Telemetry" desc="We never send your data to external servers." />
             <SovereignFeature icon={<Globe className="w-5 h-5" />} title="Offline Mode" desc="Fully functional in air-gapped networks." />
             <SovereignFeature icon={<Cpu className="w-5 h-5" />} title="ARM64 Support" desc="Optimized for Raspberry Pi 4/5." />
             <SovereignFeature icon={<Shield className="w-5 h-5" />} title="AGPL-3.0" desc="Committed to FOSS forever." />
          </div>
        </section>
      </div>
    </DocLayout>
  )
}

function HomelabUseBox({ title, description }: { title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-foreground/[0.03] border border-border/5">
      <h4 className="font-black uppercase tracking-widest text-xs text-acid-lime mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function SovereignFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime">
        {icon}
      </div>
      <div>
        <h5 className="font-bold text-foreground text-sm uppercase tracking-widest mb-1">{title}</h5>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
