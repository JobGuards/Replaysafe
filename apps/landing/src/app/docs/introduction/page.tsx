"use client";

import React from "react";
import { CheckCircle2, Zap, Shield, Search, ArrowRight } from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function IntroDoc() {
  return (
    <DocLayout
      title="Introduction"
      subtitle="Execution Memory for AI Agents"
      category="Getting Started"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          ReplaySafe is the{" "}
          <strong className="text-foreground">
            Execution Memory & Side-Effect Control Plane
          </strong>{" "}
          for AI agents. It ensures that every external operation - payments,
          emails, API calls, database writes - happens{" "}
          <strong className="text-foreground">exactly once</strong>, even when
          agents retry, crash, or run concurrently.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic">
            Why ReplaySafe?
          </h3>
          <p className="mb-10 leading-relaxed text-muted-foreground">
            AI agents are inherently unreliable. They retry on failure, run
            concurrently, and operate on external systems that don't guarantee
            idempotency. ReplaySafe gives your agents a durable execution ledger
            - a complete record of every side effect, its lifecycle state, and
            provider-native proof of what actually happened.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureItem
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="Idempotency Enforcement"
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5" />}
              title="Provider Verification"
            />
            <FeatureItem
              icon={<Search className="w-5 h-5" />}
              title="Failure Classification"
            />
            <FeatureItem
              icon={<Zap className="w-5 h-5" />}
              title="Crash Recovery"
            />
          </div>
        </section>

        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Core Capabilities
          </h2>
          <div className="grid gap-16">
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">
                01. Execution Ledger
              </h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                Full state machine lifecycle: INTENDED → EXECUTING → COMMITTED →
                VERIFIED. Timestamps at every transition. Provider receipts
                stored as proof. The system always knows what happened.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">
                02. Provider Verification
              </h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                When an operation times out, ReplaySafe asks the provider
                (Stripe, SendGrid, GitHub) if it actually succeeded. Built-in
                verifiers for 8+ providers with automatic failure
                classification.
              </p>
            </div>
            <div className="group">
              <h4 className="font-black uppercase tracking-[0.3em] text-[10px] mb-4 text-acid-lime group-hover:translate-x-2 transition-transform italic">
                03. Recovery Engine
              </h4>
              <p className="leading-relaxed text-muted-foreground text-lg">
                guard.resume() computes a minimal safe continuation plan - skip
                verified effects, retry transient failures, block semantic
                failures for human approval. No more restarting from scratch.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2
            className="text-4xl font-black uppercase tracking-tight text-foreground italic"
            id="quick-start"
          >
            Quick Start
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Install the SDK and wrap your first side effect in under 5 minutes.
            ReplaySafe operates on an{" "}
            <strong className="text-foreground">execution memory</strong> model
            - every side effect is tracked from intent to verification.
          </p>
          <div className="group relative p-10 bg-foreground/[0.02] rounded-[2.5rem] border border-border/10 hover:border-acid-lime/30 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-acid-lime/20"></div>
            <code className="text-sm font-mono text-acid-lime block mb-4 selection:bg-acid-lime/30">
              pnpm add @replaysafe/guard-sdk
            </code>
            <code className="text-sm font-mono text-foreground/40 block selection:bg-acid-lime/30">
              {`# Then wrap your side effect:
const result = await guard.effect({
  type: 'STRIPE_OPERATION',
  target: 'stripe-charge',
  input: { orderId, amount: 2999 },
  execute: () => stripe.charges.create({ amount: 2999, currency: 'usd' }),
  receipt: (r) => ({ chargeId: r.id }),
})`}
            </code>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}

function FeatureItem({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-acid-lime">{icon}</div>
      <span className="text-sm font-bold text-foreground/80">{title}</span>
    </div>
  );
}
