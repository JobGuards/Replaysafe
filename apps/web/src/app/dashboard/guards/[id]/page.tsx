'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { 
  Shield, 
  Zap, 
  Clock, 
  ChevronLeft, 
  ArrowRight, 
  BrainCircuit, 
  Globe, 
  Database, 
  Mail, 
  Cpu, 
  CheckCircle2, 
  XCircle,
  History
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

export default function ExecutionDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { activeOrganization } = useAuth()

  const { data: execution, error } = useSWR(
    id && activeOrganization ? `/api/guards/${id}` : null,
    () => api.getGuardedExecution(id)
  )

  if (error) return (
    <div className="min-h-screen p-12 bg-tech-grid flex flex-col items-center justify-center">
      <div className="p-8 glass-panel border-destructive/20 text-center max-w-md">
        <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-black uppercase tracking-tight text-destructive mb-2">Protocol Error</h2>
        <p className="text-muted-foreground text-sm mb-6">{error.message || 'Failed to retrieve execution memory.'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/guards')}>Back to Sessions</Button>
      </div>
    </div>
  )
  if (!execution) return <div className="p-12 text-muted-foreground animate-pulse font-black uppercase tracking-widest italic">Synchronizing Memory...</div>

  const stats = {
    total: execution.sideEffects.length,
    executed: execution.sideEffects.filter((s: any) => s.status === 'COMPLETED').length,
    skipped: execution.sideEffects.filter((s: any) => s.status === 'SKIPPED').length,
  }

  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'HTTP': return <Globe className="w-4 h-4" />
      case 'DB': return <Database className="w-4 h-4" />
      case 'EMAIL': return <Mail className="w-4 h-4" />
      case 'AI_GENERATION': return <Cpu className="w-4 h-4" />
      default: return <BrainCircuit className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen p-6 md:p-12 bg-tech-grid">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation */}
        <Button 
          variant="ghost" 
          className="group text-muted-foreground hover:text-acid-lime"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Sessions
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-acid-lime/5 border border-acid-lime/20">
              <History className="w-3.5 h-3.5 text-acid-lime" />
              <span className="text-[10px] font-black uppercase tracking-widest text-acid-lime italic">Execution_Memory: Attempt {execution.attempt}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              {execution.monitor?.name || 'Untitled Job'}
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              UUID: <span className="text-foreground/60">{execution.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-6 py-3 rounded-2xl border ${
              execution.status === 'SUCCESS' ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime' : 'bg-destructive/10 border-destructive/20 text-destructive'
            } flex items-center gap-3`}>
              {execution.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <span className="font-black uppercase tracking-widest italic text-sm">{execution.status}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-8 border-border/10 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BrainCircuit className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Total Effects</p>
            <p className="text-5xl font-black text-foreground">{stats.total}</p>
          </div>
          <div className="glass-panel p-8 border-border/10 rounded-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">New Executions</p>
            <p className="text-5xl font-black text-foreground">{stats.executed}</p>
          </div>
          <div className="glass-panel p-8 border-acid-lime/10 rounded-3xl bg-acid-lime/[0.02] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-20 h-20 text-acid-lime" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-acid-lime mb-4 italic">Bypassed (Saved)</p>
            <p className="text-5xl font-black text-acid-lime">{stats.skipped}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8 pb-20">
          <h3 className="text-2xl font-black uppercase tracking-tight italic flex items-center gap-3">
             Trace_Timeline <ArrowRight className="w-5 h-5 text-acid-lime" />
          </h3>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-acid-lime/50 via-border/20 to-transparent" />

            <div className="space-y-10">
              {execution.sideEffects.map((effect: any, index: number) => (
                <div key={effect.id} className="relative pl-16 group">
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 z-10 ${
                    effect.status === 'SKIPPED' 
                      ? 'bg-acid-lime border-acid-lime text-primary-foreground shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.4)]' 
                      : 'bg-background border-border/20 text-muted-foreground group-hover:border-foreground group-hover:text-foreground'
                  }`}>
                    {effect.status === 'SKIPPED' ? <Shield className="w-5 h-5" /> : getEffectIcon(effect.type)}
                  </div>

                  {/* Content */}
                  <div className={`glass-panel p-8 rounded-[2rem] border border-border/10 transition-all duration-500 ${
                    effect.status === 'SKIPPED' ? 'bg-acid-lime/[0.03] border-acid-lime/20 shadow-2xl shadow-acid-lime/5' : 'hover:border-border/20'
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-foreground/[0.05] border-border/10 font-black uppercase tracking-widest text-[9px] px-3">
                          {effect.type}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">ID: {effect.fingerprint.substring(0, 12)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                        <span className="text-xs font-bold text-muted-foreground/60">{formatDistanceToNow(new Date(effect.executedAt))} ago</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-black uppercase tracking-tight text-foreground truncate">
                        {effect.target || 'Internal Operation'}
                      </h4>
                      <div className="p-4 rounded-xl bg-background/40 border border-border/5 font-mono text-[10px] text-muted-foreground overflow-x-auto whitespace-pre">
                        Input_Hash: {effect.inputHash}
                      </div>
                    </div>

                    {effect.status === 'SKIPPED' && (
                      <div className="mt-8 pt-6 border-t border-acid-lime/10 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <BrainCircuit className="w-4 h-4 text-acid-lime" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-acid-lime italic">Retrieved from attempt {effect.metadata?.originalExecutionId?.split('-')[0] || '1'}</span>
                         </div>
                         <Badge className="bg-acid-lime text-primary-foreground font-black uppercase tracking-[0.2em] text-[8px] italic shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.3)]">
                            Exactly-Once Guarantee
                         </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {execution.status === 'SUCCESS' && (
                <div className="relative pl-16">
                  <div className="absolute left-0 w-12 h-12 rounded-full bg-acid-lime/20 border border-acid-lime/40 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-acid-lime" />
                  </div>
                  <div className="py-3">
                    <p className="text-sm font-black uppercase tracking-widest text-acid-lime italic">Job_Synchronized_Successfully</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
