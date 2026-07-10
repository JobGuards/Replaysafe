"use client";

import React from "react";
import {
  ShieldCheck,
  XCircle,
  CheckCircle,
  ArrowRight,
  Zap,
  Database,
  GitMerge,
  Eye,
  Shield,
  Clock,
  Search,
} from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function StripeVsReplaySafeDoc() {
  return (
    <DocLayout
      title="Stripe vs ReplaySafe"
      subtitle="Why Idempotency Keys Aren't Enough"
      category="Comparison"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          Stripe&apos;s idempotency keys prevent duplicate Stripe API calls.
          ReplaySafe prevents duplicate{" "}
          <strong className="text-foreground">real-world consequences</strong>{" "}
          across your entire system - emails, webhooks, database writes, GitHub
          issues, and any custom API.
        </p>

        {/* ── Side by Side ───────────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Side by Side
          </h2>

          <div className="glass-panel rounded-[2.5rem] border-border/10 overflow-hidden">
            <div className="grid grid-cols-3 border-b border-border/10">
              <div className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                Aspect
              </div>
              <div className="p-5 text-[10px] font-black uppercase tracking-widest text-red-400/60 border-x border-border/10">
                Stripe Idempotency Keys
              </div>
              <div className="p-5 text-[10px] font-black uppercase tracking-widest text-acid-lime/60">
                ReplaySafe
              </div>
            </div>
            {[
              {
                aspect: "Scope",
                stripe: "Stripe API only",
                replay:
                  "Any side effect - HTTP, email, DB, webhooks, custom APIs",
                icon: <Database className="w-4 h-4" />,
              },
              {
                aspect: "Lifetime",
                stripe: "24 hours (default)",
                replay: "Forever - ledger persists indefinitely",
                icon: <Clock className="w-4 h-4" />,
              },
              {
                aspect: "State Machine",
                stripe: "Not seen → Process → Seen (return cached)",
                replay:
                  "Full lifecycle: INTENDED → EXECUTING → COMMITTED → VERIFIED",
                icon: <GitMerge className="w-4 h-4" />,
              },
              {
                aspect: "Verification",
                stripe: "Returns cached response on retry (idempotent)",
                replay:
                  "Provider-side verification - calls Stripe/SendGrid/GitHub to confirm what actually happened",
                icon: <Search className="w-4 h-4" />,
              },
              {
                aspect: "Failure Classification",
                stripe:
                  "Per-error type (card_error, api_connection_error, etc.)",
                replay: "Unified TRANSIENT vs SEMANTIC across all providers",
                icon: <Shield className="w-4 h-4" />,
              },
              {
                aspect: "Resume / Recovery",
                stripe: "None - you rebuild logic",
                replay:
                  "guard.resume() - computes minimal safe continuation plan",
                icon: <Zap className="w-4 h-4" />,
              },
              {
                aspect: "Cross-Agent Coordination",
                stripe: "Per-request only",
                replay:
                  "Project-scoped shared ledger - Agent A's work visible to Agent B",
                icon: <Eye className="w-4 h-4" />,
              },
              {
                aspect: "Audit / Proof",
                stripe: "Stripe's logs only",
                replay:
                  "Cryptographic receipts stored in your DB, queryable anytime",
                icon: <ShieldCheck className="w-4 h-4" />,
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-foreground/[0.02]" : ""}`}
              >
                <div className="p-4 text-xs font-bold text-foreground border-r border-border/10 flex items-center gap-2">
                  {row.icon}
                  {row.aspect}
                </div>
                <div className="p-4 text-xs text-red-400/80 border-r border-border/10 flex items-center gap-2">
                  <XCircle className="w-3 h-3 shrink-0 text-red-400/60" />
                  {row.stripe}
                </div>
                <div className="p-4 text-xs text-acid-lime/80 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 shrink-0 text-acid-lime/60" />
                  {row.replay}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── The Core Difference ─────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            The Core Difference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-400" />
                <h4 className="font-bold text-foreground">
                  Stripe Idempotency
                </h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prevents duplicate <em>API calls</em> to Stripe. If you send the
                same idempotency key twice within 24 hours, Stripe returns the
                cached response. But it doesn&apos;t know about your emails,
                webhooks, database writes, or other side effects.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-acid-lime/5 border border-acid-lime/20">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-acid-lime" />
                <h4 className="font-bold text-foreground">ReplaySafe</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Prevents duplicate <em>real-world consequences</em> across your
                entire system. Fingerprints every operation and tracks it
                through a full lifecycle. When something times out, it asks the
                provider what actually happened before retrying.
              </p>
            </div>
          </div>
        </section>

        {/* ── When to Use Which ───────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            When to Use Which
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-acid-lime" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight italic text-sm">
                  Use Stripe Idempotency When
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You only care about duplicate Stripe calls, you&apos;re okay
                  with 24-hour key expiry, and you don&apos;t need cross-system
                  coordination or verification.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-3 h-3 text-acid-lime" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight italic text-sm">
                  Use ReplaySafe When
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You have multiple side effects (payments + emails + DB
                  writes), you need provider verification when outcomes are
                  unknown, you want crash recovery with{" "}
                  <code className="text-acid-lime font-mono">
                    guard.resume()
                  </code>
                  , or you&apos;re running multiple agents that need to
                  coordinate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── You Can Use Both ────────────────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            You Can Use Both
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            ReplaySafe doesn&apos;t replace Stripe&apos;s idempotency keys — it
            layers on top. You can still pass idempotency keys to Stripe while
            ReplaySafe tracks the full lifecycle and coordinates across your
            entire system.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02]">
            <pre className="text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`// ReplaySafe + Stripe idempotency — belt and suspenders
const result = await guard.effect({
  type: 'STRIPE_OPERATION',
  target: 'stripe-charge',
  input: { orderId, amount: 2999 },
  provider: 'stripe',
  execute: () => stripe.charges.create(
    { amount: 2999, currency: 'usd' },
    { idempotencyKey: \`order_\${orderId}\` }  // Stripe's built-in dedup
  ),
  receipt: (r) => ({ chargeId: r.id }),
})`}
            </pre>
          </div>
        </section>

        {/* ── Integration with Replaysafe ─────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Next Steps
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Ready to add execution memory to your agents? Start with the
            ReplayGuard SDK.
          </p>
          <div className="flex gap-4">
            <a
              href="/docs/replay-guard"
              className="flex items-center gap-2 bg-acid-lime text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all"
            >
              ReplayGuard SDK <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
