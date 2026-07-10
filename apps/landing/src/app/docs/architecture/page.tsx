"use client";

import React from "react";
import { Server, Shield, Database, Lock, Zap } from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function ArchitectureDoc() {
  return (
    <DocLayout
      title="Architecture"
      subtitle="Engineering"
      category="Infrastructure"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed">
          A modular, scalable, and security-hardened infrastructure built for
          high-performance execution memory and side-effect coordination for AI
          agents.
        </p>

        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Tech Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StackItem
              title="Frontend"
              content="Next.js 15, Tailwind 4, Lucide"
            />
            <StackItem title="Backend" content="Express, Node.js, Fastify" />
            <StackItem title="Database" content="PostgreSQL, Redis" />
            <StackItem title="ORM" content="Prisma" />
            <StackItem
              title="SDK"
              content="@replaysafe/guard-sdk (TypeScript)"
            />
            <StackItem
              title="Verification"
              content="Postmark, SES, Stripe, SendGrid, GitHub, Slack, Twilio, S3"
            />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Core Components
          </h2>

          <div className="space-y-12">
            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Server className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">
                  Guard_API
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  The primary API layer for execution memory operations. Handles
                  side effect lifecycle management, conflict detection, provider
                  verification, and recovery plan computation. Optimized for
                  millisecond-latency processing.
                </p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Zap className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">
                  Verification_Engine
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Background worker that resolves UNKNOWN side effects by
                  querying provider APIs. Classifies failures as TRANSIENT (safe
                  to retry) or SEMANTIC (needs human review). Polls at 60s
                  intervals with 30s grace period.
                </p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">
                  Execution_Ledger
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  PostgreSQL-backed durable storage for all side effect
                  lifecycle records. Partial unique index on (fingerprint,
                  projectId) WHERE status = 'EXECUTING' prevents TOCTOU race
                  conditions for cross-agent coordination.
                </p>
              </div>
            </div>

            <div className="flex gap-8 group">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 text-acid-lime group-hover:scale-110 transition-transform duration-500">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black uppercase tracking-[0.3em] text-[10px] text-acid-lime italic">
                  Security_Vault
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  Implements field-level AES-256-GCM encryption for all
                  sensitive provider credentials and configuration. Manages the
                  lifecycle of cryptographic keys and performs proactive
                  security audits.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}

function StackItem({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border/10 bg-card/30">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime mb-2">
        {title}
      </h4>
      <p className="text-sm font-bold text-foreground">{content}</p>
    </div>
  );
}
