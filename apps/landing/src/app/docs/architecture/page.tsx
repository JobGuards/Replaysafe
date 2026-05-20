'use client'

import React from 'react'
import { Server, Shield, Database, Lock, Zap } from 'lucide-react'
import { DocLayout } from '@/components/docs/DocLayout'

export default function ArchitectureDoc() {
  return (
    <DocLayout 
      title="Architecture" 
      subtitle="Engineering" 
      category="Infrastructure"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed">
          A modular, scalable, and security-hardened infrastructure built for high-performance monitoring.
        </p>

        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Tech Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StackItem title="Frontend" content="Next.js 15, Tailwind 4, Lucide" />
            <StackItem title="Backend" content="Express, Node.js, Fastify" />
            <StackItem title="Database" content="PostgreSQL, Redis" />
            <StackItem title="ORM" content="Prisma" />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Core Components</h2>
          
          <div className="space-y-12">
            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Server className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">Sentinel_Gateway</h4>
                <p className="text-muted-foreground leading-relaxed">
                  The primary ingest layer for high-fidelity telemetry. Optimized for millisecond-latency processing of both heartbeat pushes and complex tunnel handshake data.
                </p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">Intelligence_Engine</h4>
                <p className="text-muted-foreground leading-relaxed">
                  A high-concurrency processing layer that calculates health scores in real-time. It detects silent failures and network degradation using advanced statistical analysis of historical pulse data.
                </p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">Security_Vault</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Implements field-level AES-256-GCM encryption for all sensitive infrastructure configurations. Manages the lifecycle of cryptographic keys and performs the proactive Security Audits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  )
}

function StackItem({ title, content }: { title: string, content: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border/10 bg-card/30">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime mb-2">{title}</h4>
      <p className="text-sm font-bold text-foreground">{content}</p>
    </div>
  )
}
