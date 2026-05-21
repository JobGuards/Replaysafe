'use client'

import React from 'react'
import { ShieldCheck, Zap, Repeat, ShieldAlert, ArrowRight, Code } from 'lucide-react'
import { DocLayout } from '@/components/docs/DocLayout'

export default function ReplayGuardDoc() {
  return (
    <DocLayout 
      title="ReplayGuard SDK" 
      subtitle="Execution Safety Layer" 
      category="Advanced Safety"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          ReplayGuard makes retrying failed background jobs safe by preventing duplicate side effects like double payments, emails, or data corruption.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic">The Safety Guarantee</h3>
          <p className="mb-10 leading-relaxed text-muted-foreground">
            ReplayGuard sits between your job logic and its side effects. It fingerprints every operation and ensures they happen **exactly once**, regardless of how many times you press "Retry".
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureItem icon={<Repeat className="w-5 h-5" />} title="Idempotency Enforcement" />
            <FeatureItem icon={<ShieldAlert className="w-5 h-5" />} title="Rollback-Aware Workflows" />
            <FeatureItem icon={<Zap className="w-5 h-5" />} title="Replay-Safe Deduplication" />
            <FeatureItem icon={<ShieldCheck className="w-5 h-5" />} title="Safety ROI Tracking" />
          </div>
        </section>

        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Rollback-Aware Workflows</h2>
          <p className="leading-relaxed text-muted-foreground">
            Sometimes a job fails mid-way, leaving your system in an inconsistent state. ReplayGuard allows you to register **Compensation Hooks** that run automatically if the job terminates unsuccessfully.
          </p>
          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02]">
            <pre className="text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
{`await guard.compensate('PAYMENT', 'stripe-charge', inputs, {
  type: 'HTTP_DELETE',
  target: \`https://api.stripe.com/v1/refunds/\${paymentId}\`,
  payload: { reason: 'Job failed' }
});`}
            </pre>
          </div>
        </section>

        <section className="space-y-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Installation</h2>
          <div className="group relative p-10 bg-foreground/[0.02] rounded-[2.5rem] border border-border/10 hover:border-acid-lime/30 transition-all overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-acid-lime/20"></div>
            <code className="text-sm font-mono text-acid-lime block selection:bg-acid-lime/30">
              pnpm add @replaysafe/guard-sdk
            </code>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Usage</h2>
          <p className="leading-relaxed text-muted-foreground">
            Wrap your job with <code className="text-acid-lime font-mono">withReplayGuard</code> and use the <code className="text-acid-lime font-mono">guard</code> instance for side effects.
          </p>
          
          <div className="glass-panel border border-border/10 rounded-[2.5rem] overflow-hidden">
            <div className="p-4 bg-foreground/5 border-b border-border/5 flex items-center gap-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">payment-job.ts</span>
            </div>
            <pre className="p-8 text-sm font-mono text-foreground/80 leading-relaxed overflow-x-auto">
{`import { withReplayGuard } from '@replaysafe/guard-sdk'

export const processPayment = async (orderId: string) => {
  return await withReplayGuard(config, async (guard) => {
    // This DB write will be skipped on replay if it succeeded before
    await guard.wrap('DB', 'orders', { orderId }, async () => {
      await db.order.update({ where: { id: orderId }, data: { status: 'PAID' } })
    })

    // This HTTP call is automatically guarded
    await guard.fetch('https://api.stripe.com/v1/charges', {
      method: 'POST',
      body: JSON.stringify({ orderId })
    })
  }, orderId)
}`}
            </pre>
          </div>
        </section>

        <section className="space-y-8 pt-16 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Integration with Replaysafe</h2>
          <p className="leading-relaxed text-muted-foreground">
            Once integrated, your job executions will appear in the **Sentinel Hub Dashboard** under "Guarded Replays", where you can audit every side effect and safely trigger retries.
          </p>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 bg-acid-lime text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
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
