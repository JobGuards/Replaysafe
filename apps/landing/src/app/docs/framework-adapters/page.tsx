"use client";

import React from "react";
import { ArrowRight, Code, ShieldCheck } from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function FrameworkAdaptersDoc() {
  return (
    <DocLayout
      title="Framework Adapters"
      subtitle="Drop-In Safety"
      category="Integration"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          One line to make any framework safe. Each adapter uses{" "}
          <code className="text-acid-lime font-mono">guard.effect()</code>{" "}
          internally with provider receipt extraction, writing full ledger
          entries automatically.
        </p>

        {/* ── Supported Frameworks ────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Supported Frameworks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "LangGraph", icon: "⬡", color: "#1a73e8" },
              { name: "CrewAI", icon: "👥", color: "#00b894" },
              { name: "Inngest", icon: "⚡", color: "#e8821a" },
              { name: "n8n", icon: "◆", color: "#ea4b71" },
              { name: "Airflow", icon: "🌊", color: "#017cee" },
              { name: "Anthropic MCP", icon: "🧠", color: "#d97706" },
              { name: "OpenAI Assistants", icon: "🤖", color: "#10a37f" },
              { name: "Vercel AI SDK", icon: "⬟", color: "#4a9eff" },
            ].map((fw) => (
              <div
                key={fw.name}
                className="glass-panel rounded-xl p-4 border border-border/10 hover:border-acid-lime/30 transition-all text-center"
              >
                <div className="text-2xl mb-2">{fw.icon}</div>
                <div className="text-xs font-black uppercase tracking-tight">
                  {fw.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LangGraph ───────────────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            LangGraph
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Wrap your LangGraph nodes with{" "}
            <code className="text-acid-lime font-mono">guard.langGraph()</code>{" "}
            to make them retry-safe. The adapter automatically extracts the
            receipt from the node&apos;s return value.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 bg-foreground/5 border-b border-border/5 flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                charge-node.ts
              </span>
            </div>
            <pre className="p-8 text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`import { guard } from '@replaysafe/guard-sdk'

async function chargeNode(state) {
  const charge = await guard.langGraph(
    'stripe-charge',
    { amount: state.amount, customer: state.customerId },
    () => stripe.charges.create({
      amount: state.amount,
      customer: state.customerId,
    })
  )
  return { chargeId: charge.id }
}`}
            </pre>
          </div>
        </section>

        {/* ── CrewAI ──────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            CrewAI
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Wrap your CrewAI tool calls with{" "}
            <code className="text-acid-lime font-mono">guard.crewai()</code> to
            prevent duplicate tool executions across agent retries.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 bg-foreground/5 border-b border-border/5 flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                search-tool.ts
              </span>
            </div>
            <pre className="p-8 text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`import { guard } from '@replaysafe/guard-sdk'

async function searchTool(query) {
  return await guard.crewai(
    'web-search',
    { query },
    () => tavily.search({ query })
  )
}`}
            </pre>
          </div>
        </section>

        {/* ── Inngest ─────────────────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Inngest
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Wrap your Inngest step functions with{" "}
            <code className="text-acid-lime font-mono">guard.inngest()</code> to
            make each step idempotent across function retries.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 bg-foreground/5 border-b border-border/5 flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                process-order.ts
              </span>
            </div>
            <pre className="p-8 text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`import { guard } from '@replaysafe/guard-sdk'

export const processOrder = inngest.createFunction(
  { id: 'process-order' },
  { event: 'order.created' },
  async ({ event, step }) => {
    await step.run('charge', () =>
      guard.inngest('stripe-charge', { orderId: event.data.orderId },
        () => stripe.charges.create({ amount: event.data.amount })
      )
    )
  }
)`}
            </pre>
          </div>
        </section>

        {/* ── MCP & OpenAI ────────────────────────────────────────────── */}
        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            MCP & OpenAI Assistants
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            For Anthropic MCP tools and OpenAI Assistants, use{" "}
            <code className="text-acid-lime font-mono">guard.mcp()</code> and{" "}
            <code className="text-acid-lime font-mono">guard.openai()</code>{" "}
            respectively. These adapters handle the provider-specific receipt
            extraction automatically.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 bg-foreground/5 border-b border-border/5 flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                mcp-tool.ts
              </span>
            </div>
            <pre className="p-8 text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`import { guard } from '@replaysafe/guard-sdk'

// Anthropic MCP
await guard.mcp('file-write', { path, content },
  () => fs.writeFile(path, content)
)

// OpenAI Assistants
await guard.openai('code-interpreter', { input },
  () => openai.assistants.code({ input })
)`}
            </pre>
          </div>
        </section>

        {/* ── Any Framework ───────────────────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Any Framework
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Don&apos;t see your framework? Use{" "}
            <code className="text-acid-lime font-mono">guard.effect()</code>{" "}
            directly — it works with any async function. The adapter just
            provides convenience methods for receipt extraction.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02]">
            <pre className="text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
              {`// Generic usage — works with any framework
const result = await guard.effect({
  type: 'CUSTOM_OPERATION',
  target: 'my-api-call',
  input: { key: 'value' },
  execute: () => myCustomFunction(),
  receipt: (r) => ({ id: r.id }),
})`}
            </pre>
          </div>
        </section>

        {/* ── Next Steps ──────────────────────────────────────────────── */}
        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Next Steps
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Ready to make your framework retry-safe? Start with the ReplayGuard
            SDK.
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
