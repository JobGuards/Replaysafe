'use client'

import React from 'react'
import { DocLayout } from '@/components/docs/DocLayout'
import { ShieldAlert, Key, Calendar, History } from 'lucide-react'

export default function SecuritySentinelDoc() {
  return (
    <DocLayout 
      title="Security Sentinel" 
      subtitle="Proactive Infrastructure Safety" 
      category="Infrastructure"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed text-foreground/80">
          The **Security Sentinel** protects your infrastructure access by monitoring the health and rotation of your cryptographic credentials.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic flex items-center gap-4">
            <Key className="text-acid-lime w-6 h-6" /> Credential Lifecycle Tracking
          </h3>
          <p className="leading-relaxed text-muted-foreground mb-8">
            Stale keys are a primary target for lateral movement. Security Sentinel automatically monitors the age of your WireGuard keys, SSH keys, and SSL certificates, alerting you before they become a liability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SafetyItem 
              icon={<Calendar className="w-5 h-5" />} 
              title="Key Rotation Audits" 
              desc="Automatic tracking of how long a key has been active. Alerting at 30, 60, or 90 day thresholds."
            />
            <SafetyItem 
              icon={<ShieldAlert className="w-5 h-5" />} 
              title="Certificate Expiry" 
              desc="Deep inspection of SSL/TLS certificates with advanced warning 30 days prior to expiry."
            />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Security Audits</h2>
          <p className="text-muted-foreground">
            Force a sentinel audit to verify all active infrastructure endpoints against your security policy.
          </p>
          <div className="bg-foreground/[0.02] p-8 rounded-[2.5rem] border border-border/10 font-mono text-sm space-y-4">
            <div className="text-acid-lime"># Force a global security audit</div>
            <div className="text-foreground/60">
              stillup audit --all --policy-strict
            </div>
          </div>
        </section>

        <section className="space-y-6 pt-12 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">Compliance Reporting</h2>
          <p className="text-muted-foreground leading-relaxed">
            Generate point-in-time compliance snapshots showing that all active network tunnels are using rotated keys and valid certificates.
          </p>
          <div className="flex items-center gap-4 p-6 bg-acid-lime/5 rounded-2xl border border-acid-lime/20">
            <History className="text-acid-lime w-6 h-6" />
            <div className="text-sm font-black uppercase tracking-widest text-acid-lime italic">Audit Trail: Fully Immutable</div>
          </div>
        </section>
      </div>
    </DocLayout>
  )
}

function SafetyItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="space-y-4 group">
      <div className="flex items-center gap-3">
        <div className="text-acid-lime group-hover:scale-110 transition-transform">{icon}</div>
        <h4 className="font-black uppercase tracking-tight text-sm">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}
