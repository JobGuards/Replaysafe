"use client";

import React from "react";
import {
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function ProviderCoverageDoc() {
  return (
    <DocLayout
      title="Provider Coverage"
      subtitle="Built-in Verification"
      category="Reference"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          ReplaySafe verifies UNKNOWN side effects by querying provider APIs
          directly. Each provider verifier classifies failures as either{" "}
          <strong className="text-foreground">TRANSIENT</strong> (safe to retry)
          or <strong className="text-foreground">SEMANTIC</strong> (needs human
          review).
        </p>

        {/* ── Built-in Providers ──────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Built-in Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProviderCard
              name="Stripe"
              icon="💳"
              category="Payments"
              verifyMethod="GET /v1/charges/:id"
              transientExamples={["network timeout", "429 rate limit"]}
              semanticExamples={[
                "card declined",
                "insufficient funds",
                "charge disputed",
              ]}
            />
            <ProviderCard
              name="SendGrid"
              icon="📧"
              category="Email"
              verifyMethod="GET /v3/messages/:id"
              transientExamples={["API timeout", "503 service unavailable"]}
              semanticExamples={["mailbox full", "invalid email", "bounced"]}
            />
            <ProviderCard
              name="Postmark"
              icon="📮"
              category="Email"
              verifyMethod="GET /messages/outbound/:id/details"
              transientExamples={["connection timeout", "429 rate limit"]}
              semanticExamples={["bounced", "suppressed", "spam complaint"]}
            />
            <ProviderCard
              name="AWS SES"
              icon="📬"
              category="Email"
              verifyMethod="Check receipt.status field"
              transientExamples={["throttling", "temporary failure"]}
              semanticExamples={[
                "permanent bounce",
                "suppressed",
                "invalid recipient",
              ]}
            />
            <ProviderCard
              name="GitHub"
              icon="🐙"
              category="Dev Tools"
              verifyMethod="GET /repos/:owner/:repo/issues/:id"
              transientExamples={["rate limit (403)", "API timeout"]}
              semanticExamples={[
                "issue not found",
                "repo deleted",
                "permission denied",
              ]}
            />
            <ProviderCard
              name="Slack"
              icon="💬"
              category="Messaging"
              verifyMethod="GET /conversations.info"
              transientExamples={["rate limit (429)", "network error"]}
              semanticExamples={[
                "channel not found",
                "token revoked",
                "user not in channel",
              ]}
            />
            <ProviderCard
              name="Twilio"
              icon="📱"
              category="SMS / Voice"
              verifyMethod="GET /2010-04-01/Accounts/:sid/Messages/:sid.json"
              transientExamples={["API timeout", "503 service unavailable"]}
              semanticExamples={["invalid number", "undelivered", "failed"]}
            />
            <ProviderCard
              name="AWS S3"
              icon="🪣"
              category="Storage"
              verifyMethod="HEAD /:bucket/:key"
              transientExamples={["connection timeout", "503 slow down"]}
              semanticExamples={[
                "access denied",
                "bucket not found",
                "object not found",
              ]}
            />
          </div>
        </section>

        {/* ── Failure Classification ──────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Failure Classification
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Every provider verifier classifies failures into two categories.
            This classification drives the Recovery Engine&apos;s decisions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold text-foreground">TRANSIENT</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Temporary failures that are safe to retry automatically. The
                operation may or may not have succeeded.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  Network timeouts
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  Rate limiting (429)
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  Service unavailable (503)
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-400" />
                <h4 className="font-bold text-foreground">SEMANTIC</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The operation completed but returned a wrong or stale result.
                Retrying blindly will produce the same outcome.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <XCircle className="w-3 h-3 text-red-400" />
                  Card declined
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <XCircle className="w-3 h-3 text-red-400" />
                  Email bounced
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <XCircle className="w-3 h-3 text-red-400" />
                  Resource not found
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Custom Verifiers ────────────────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Custom Verifiers
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Need to verify against a provider not listed above? Register a
            custom verifier.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02]">
            <pre className="text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`import { verifierRegistry } from '@replaysafe/guard-sdk'

class MyCustomVerifier {
  provider = 'my-provider'

  async verify(entry) {
    const response = await fetch(\`https://api.my-provider.com/status/\${entry.receipt.id}\`)
    const data = await response.json()

    if (data.status === 'delivered') {
      return { status: 'VERIFIED' }
    }
    if (data.status === 'bounced') {
      return { status: 'FAILED', failureType: 'SEMANTIC' }
    }
    return { status: 'UNKNOWN' }
  }
}

verifierRegistry.register(new MyCustomVerifier())`}
            </pre>
          </div>
        </section>

        {/* ── Adding New Providers ────────────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Adding New Providers
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            To add a new built-in provider verifier, implement the{" "}
            <code className="text-acid-lime font-mono">Verifier</code> interface
            and register it in the VerificationService. See the existing
            verifiers in{" "}
            <code className="text-acid-lime font-mono">
              apps/api/src/services/verifiers/
            </code>{" "}
            for reference.
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

function ProviderCard({
  name,
  icon,
  category,
  verifyMethod,
  transientExamples,
  semanticExamples,
}: {
  name: string;
  icon: string;
  category: string;
  verifyMethod: string;
  transientExamples: string[];
  semanticExamples: string[];
}) {
  return (
    <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-border/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <h4 className="font-bold text-foreground">{name}</h4>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
            {category}
          </p>
        </div>
        <ShieldCheck className="w-4 h-4 text-acid-lime ml-auto" />
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
            Verify Method
          </p>
          <code className="text-xs font-mono text-acid-lime">
            {verifyMethod}
          </code>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400/60 mb-1">
            TRANSIENT (safe to retry)
          </p>
          <div className="flex flex-wrap gap-1">
            {transientExamples.map((ex) => (
              <span
                key={ex}
                className="text-[10px] px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-1">
            SEMANTIC (needs review)
          </p>
          <div className="flex flex-wrap gap-1">
            {semanticExamples.map((ex) => (
              <span
                key={ex}
                className="text-[10px] px-2 py-0.5 rounded bg-red-400/10 text-red-400"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
