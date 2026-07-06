"use client";

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { api } from '@/lib/api'
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ChevronLeft,
  RefreshCw,
  Hash,
  AlertTriangle,
  Zap,
  Globe,
  Database,
  Loader2,
  Circle,
  RotateCcw,
  ShieldCheck,
  FastForward,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

const fetcher = (id: string) => api.getGuardedExecution(id);

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6: Status config for all lifecycle states
// ─────────────────────────────────────────────────────────────────────────────

type StatusConfig = {
  color: string
  dotColor: string
  icon: React.FC<{ className?: string }>
  label: string
  pulse?: boolean
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  COMMITTED:   { color: 'text-acid-lime',   dotColor: 'bg-acid-lime',   icon: CheckCircle2,  label: 'Committed' },
  VERIFIED:    { color: 'text-emerald-400', dotColor: 'bg-emerald-400', icon: ShieldCheck,   label: 'Verified' },
  SKIPPED:     { color: 'text-blue-400',    dotColor: 'bg-blue-400',    icon: FastForward,   label: 'Skipped' },
  EXECUTING:   { color: 'text-yellow-400',  dotColor: 'bg-yellow-400',  icon: Loader2,       label: 'Executing',  pulse: true },
  INTENDED:    { color: 'text-zinc-500',    dotColor: 'bg-zinc-500',    icon: Circle,        label: 'Intended' },
  UNKNOWN:     { color: 'text-orange-400',  dotColor: 'bg-orange-400',  icon: AlertTriangle, label: 'Unknown',    pulse: true },
  FAILED:      { color: 'text-destructive', dotColor: 'bg-destructive', icon: XCircle,       label: 'Failed' },
  COMPENSATED: { color: 'text-purple-400',  dotColor: 'bg-purple-400',  icon: RotateCcw,     label: 'Compensated' },
  // Legacy fallbacks
  COMPLETED:   { color: 'text-acid-lime',   dotColor: 'bg-acid-lime',   icon: CheckCircle2,  label: 'Completed' },
}

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status] ?? { color: 'text-muted-foreground', dotColor: 'bg-muted', icon: Circle, label: status }
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt display component
// ─────────────────────────────────────────────────────────────────────────────

function ReceiptPanel({ receipt }: { receipt: Record<string, any> }) {
  const [open, setOpen] = useState(false)
  const entries = Object.entries(receipt)
  if (entries.length === 0) return null

  return (
    <div className="mt-4 border border-border/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2 bg-background/30 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-acid-lime transition-colors"
      >
        <span>Provider Receipt</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 bg-background/20">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">{k}</span>
              <span className="text-[10px] font-mono text-acid-lime/80 truncate max-w-[200px]">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline node for a single side effect
// ─────────────────────────────────────────────────────────────────────────────

function EffectTimelineNode({ effect }: { effect: any }) {
  const cfg = getStatusConfig(effect.status)
  const Icon = cfg.icon

  const typeIcon = effect.type === 'HTTP' || effect.type === 'WEBHOOK'
    ? <Globe className="w-5 h-5" />
    : effect.type === 'STATE_SNAPSHOT'
    ? <Database className="w-5 h-5" />
    : <Shield className="w-5 h-5" />

  // Compute duration if we have startedAt + finishedAt
  let duration: string | null = null
  if (effect.startedAt && effect.finishedAt) {
    const ms = new Date(effect.finishedAt).getTime() - new Date(effect.startedAt).getTime()
    duration = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="relative pl-14 group">
      {/* Timeline node dot */}
      <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border z-10 transition-all group-hover:scale-110 ${
        cfg.color === 'text-acid-lime'
          ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime'
          : cfg.color === 'text-blue-400'
          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          : cfg.color === 'text-orange-400'
          ? 'bg-orange-400/10 border-orange-400/20 text-orange-400'
          : cfg.color === 'text-destructive'
          ? 'bg-destructive/10 border-destructive/20 text-destructive'
          : cfg.color === 'text-purple-400'
          ? 'bg-purple-400/10 border-purple-400/20 text-purple-400'
          : 'bg-foreground/5 border-border/10 text-muted-foreground'
      }`}>
        {typeIcon}
      </div>

      <div className="glass-panel border border-border/5 rounded-3xl p-6 hover:border-border/10 transition-all bg-foreground/[0.01]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {effect.type}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border flex items-center gap-1.5 ${
                cfg.color === 'text-acid-lime' ? 'bg-acid-lime/10 text-acid-lime border-acid-lime/20' :
                cfg.color === 'text-blue-400' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                cfg.color === 'text-orange-400' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                cfg.color === 'text-destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                cfg.color === 'text-purple-400' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                'bg-foreground/5 text-muted-foreground border-border/10'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                {cfg.label}
              </span>
              {effect.metadata?.driftDetected && (
                <span className="text-[8px] font-black uppercase tracking-widest bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  State Drift Detected
                </span>
              )}
            </div>
            <h4 className="text-lg font-bold text-foreground tracking-tight">{effect.target}</h4>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {format(new Date(effect.executedAt), 'HH:mm:ss.SSS')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background/40 border border-border/5 space-y-2">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Input Fingerprint</span>
            <div className="flex items-center gap-2 font-mono text-[10px] text-acid-lime truncate">
              <Hash className="w-3 h-3" />
              {effect.inputHash.slice(0, 16)}...
            </div>
          </div>
          {effect.metadata && (
            <div className="p-4 rounded-xl bg-background/40 border border-border/5 space-y-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
                {effect.status === 'SKIPPED' ? 'Skip Reason' : 'Result / Context'}
              </span>
              <div className="text-[10px] font-medium text-muted-foreground truncate italic">
                {effect.metadata.message || JSON.stringify(effect.metadata).slice(0, 48) + '…'}
              </div>
            </div>
          )}
        </div>

        {/* Phase 6: Receipt panel */}
        {effect.receipt && typeof effect.receipt === 'object' && (
          <ReceiptPanel receipt={effect.receipt} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function GuardExecutionDetailPage() {
  const { activeOrganization } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const { data: execution, isLoading } = useSWR(
    activeOrganization ? [`/api/guards/${id}`, activeOrganization.id] : null,
    () => fetcher(id)
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-acid-lime animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
          Reconstructing Execution Timeline...
        </p>
      </div>
    );
  }

  if (!execution) return <div>Not found</div>;

  // Phase 6: count statuses across side effects
  const effects: any[] = execution.sideEffects ?? []
  const committed   = effects.filter((e: any) => ['COMMITTED', 'VERIFIED', 'COMPLETED'].includes(e.status)).length
  const skipped     = effects.filter((e: any) => e.status === 'SKIPPED').length
  const unknown     = effects.filter((e: any) => e.status === 'UNKNOWN').length
  const failed      = effects.filter((e: any) => e.status === 'FAILED').length
  const executing   = effects.filter((e: any) => e.status === 'EXECUTING').length

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        <div className="space-y-6">
          <Link
            href="/dashboard/guards"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-acid-lime transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Memory Hub
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                  Job{" "}
                  <span className="text-acid-lime">
                    {execution.externalId || execution.id.slice(0, 8)}
                  </span>
                </h1>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  execution.status === 'SUCCESS' ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime' :
                  execution.status === 'RUNNING' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' :
                  execution.status === 'UNKNOWN' ? 'bg-orange-400/10 border-orange-400/20 text-orange-400' :
                  'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {execution.status}
                </span>

                {/* Phase 6: UNKNOWN effects warning */}
                {unknown > 0 && (
                  <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-orange-400/10 border-orange-400/30 text-orange-400 animate-pulse flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {unknown} Unknown
                  </span>
                )}
              </div>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-acid-lime" />
                {execution.monitor.name} • Attempt {execution.attempt}
                {execution.workflowId && (
                  <span className="text-muted-foreground/40 font-mono text-xs ml-2">
                    wf: {execution.workflowId.slice(0, 12)}…
                  </span>
                )}
              </p>
            </div>

            {/* Phase 6: Status counters */}
            <div className="flex flex-wrap gap-3">
              {committed > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-acid-lime/5 border border-acid-lime/10 text-center">
                  <div className="text-xl font-black text-acid-lime">{committed}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Committed</div>
                </div>
              )}
              {skipped > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                  <div className="text-xl font-black text-blue-400">{skipped}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Skipped</div>
                </div>
              )}
              {unknown > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-orange-400/5 border border-orange-400/10 text-center">
                  <div className="text-xl font-black text-orange-400">{unknown}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Unknown</div>
                </div>
              )}
              {failed > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-destructive/5 border border-destructive/10 text-center">
                  <div className="text-xl font-black text-destructive">{failed}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Failed</div>
                </div>
              )}
              {executing > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-yellow-400/5 border border-yellow-400/10 text-center">
                  <div className="text-xl font-black text-yellow-400">{executing}</div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Executing</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Timeline */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight italic flex items-center gap-3">
            <Zap className="w-5 h-5 text-acid-lime" />
            Execution Timeline
          </h2>

          <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/10">
            {effects.length === 0 && (
              <p className="pl-14 text-muted-foreground/40 text-sm italic">No side effects recorded for this execution.</p>
            )}
            {effects.map((effect: any) => (
              <EffectTimelineNode key={effect.id} effect={effect} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="glass-panel border border-border/5 rounded-[2.5rem] p-8 bg-foreground/[0.02] space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest italic text-muted-foreground">Session Intel</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">
                  Start Time
                </span>
                <span className="text-xs font-black text-foreground">
                  {format(new Date(execution.startedAt), "MMM d, HH:mm:ss")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">
                  Duration
                </span>
                <span className="text-xs font-black text-foreground">
                  {execution.finishedAt
                    ? `${Math.round((new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
                    : 'Running...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">Attempt</span>
                <span className="text-xs font-black text-foreground">#{execution.attempt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">
                  Protection Level
                </span>
                <span className="text-xs font-black text-acid-lime uppercase tracking-widest">
                  Full Sentinel
                </span>
              </div>
              {execution.workflowId && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold text-muted-foreground/60 flex-shrink-0">Workflow</span>
                  <span className="text-[10px] font-mono text-acid-lime/70 text-right truncate">{execution.workflowId}</span>
                </div>
              )}
              {execution.agentId && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-bold text-muted-foreground/60 flex-shrink-0">Agent</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60 text-right truncate">{execution.agentId}</span>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-border/5 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Environment Hash
              </h4>
              <div className="p-4 rounded-xl bg-background/40 border border-border/5 flex items-center gap-3 font-mono text-[10px] text-muted-foreground/60 italic">
                <Shield className="w-4 h-4 opacity-30" />
                {execution.environmentHash || "0xDEADD00D..."}
              </div>
            </div>
          </div>

          {unknown > 0 && (
            <div className="glass-panel border border-orange-400/20 rounded-[2.5rem] p-8 bg-orange-400/5 space-y-6">
              <div className="flex items-center gap-3 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">Unknown Outcomes</h3>
              </div>
              <p className="text-xs text-orange-400/70 leading-relaxed font-medium">
                {unknown} side effect{unknown > 1 ? 's' : ''} timed out before a confirmed response was received.
                The operation may have completed on the provider side.
                Provider-side verification arrives in Phase 7.
              </p>
            </div>
          )}

          <div className="glass-panel border border-border/5 rounded-[2.5rem] p-8 bg-destructive/5 space-y-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest italic">Safety Protocol</h3>
            </div>
            <p className="text-xs text-destructive/70 leading-relaxed font-medium">
              This session is protected by ReplayGuard. Side effects marked as &quot;Skipped&quot; were intercepted to prevent
              destructive duplication in this retry cycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
