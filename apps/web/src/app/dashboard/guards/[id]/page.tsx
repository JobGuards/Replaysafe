'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  Database
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'

import { useAuth } from '@/contexts/AuthContext'

const fetcher = (id: string) => api.getGuardedExecution(id)

export default function GuardExecutionDetailPage() {
  const { activeOrganization } = useAuth()
  const params = useParams()
  const id = params.id as string
  const { data: execution, isLoading } = useSWR(
    activeOrganization ? [`/api/guards/${id}`, activeOrganization.id] : null, 
    () => fetcher(id)
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-acid-lime animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Reconstructing Execution Timeline...</p>
      </div>
    )
  }

  if (!execution) return <div>Not found</div>

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Premium Header */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        <div className="space-y-6">
          <Link href="/dashboard/guards" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-acid-lime transition-colors">
            <ChevronLeft className="h-3 w-3" />
            Back to Memory Hub
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
                  Job <span className="text-acid-lime">{execution.externalId || execution.id.slice(0, 8)}</span>
                </h1>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  execution.status === 'SUCCESS' ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime' : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}>
                  {execution.status}
                </span>
              </div>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-acid-lime" />
                {execution.monitor.name} • Attempt {execution.attempt}
              </p>
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
            {execution.sideEffects.map((effect: any, i: number) => (
              <div key={effect.id} className="relative pl-14 group">
                {/* Node */}
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-xl flex items-center justify-center border z-10 transition-all group-hover:scale-110 ${
                  effect.type === 'STATE_SNAPSHOT' 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : effect.status === 'SKIPPED'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5'
                    : 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime'
                }`}>
                  {effect.type === 'HTTP' ? <Globe className="w-5 h-5" /> : effect.type === 'STATE_SNAPSHOT' ? <Database className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                </div>

                <div className="glass-panel border border-border/5 rounded-3xl p-6 hover:border-border/10 transition-all bg-foreground/[0.01]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{effect.type}</span>
                        {effect.status === 'SKIPPED' && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Skipped (Idempotent)
                          </span>
                        )}
                        {effect.metadata?.driftDetected && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-destructive/10 text-destructive px-1.5 py-0.5 rounded border border-destructive/20 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            State Drift Detected
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-foreground tracking-tight">{effect.target}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/40">{format(new Date(effect.executedAt), 'HH:mm:ss.SSS')}</span>
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
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Context / Result</span>
                        <div className="text-[10px] font-medium text-muted-foreground truncate italic">
                          {effect.metadata.message || JSON.stringify(effect.metadata).slice(0, 40) + '...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="glass-panel border border-border/5 rounded-[2.5rem] p-8 bg-foreground/[0.02] space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest italic text-muted-foreground">Session Intel</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">Start Time</span>
                <span className="text-xs font-black text-foreground">{format(new Date(execution.startedAt), 'MMM d, HH:mm:ss')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">Duration</span>
                <span className="text-xs font-black text-foreground">
                  {execution.finishedAt 
                    ? `${Math.round((new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
                    : 'Running...'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground/60">Protection Level</span>
                <span className="text-xs font-black text-acid-lime uppercase tracking-widest">Full Sentinel</span>
              </div>
            </div>

            <div className="pt-8 border-t border-border/5 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Environment Hash</h4>
              <div className="p-4 rounded-xl bg-background/40 border border-border/5 flex items-center gap-3 font-mono text-[10px] text-muted-foreground/60 italic">
                <Shield className="w-4 h-4 opacity-30" />
                {execution.environmentHash || '0xDEADD00D...'}
              </div>
            </div>
          </div>

          <div className="glass-panel border border-border/5 rounded-[2.5rem] p-8 bg-destructive/5 space-y-6">
             <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">Safety Protocol</h3>
             </div>
             <p className="text-xs text-destructive/70 leading-relaxed font-medium">
               This session is protected by ReplayGuard. Side effects marked as "SKIPPED" were intercepted to prevent destructive duplication in this retry cycle.
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
