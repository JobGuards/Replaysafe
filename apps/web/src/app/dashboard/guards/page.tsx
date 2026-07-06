"use client";

import React, { useState } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";

const fetcher = () => api.getGuardedExecutions();

export default function GuardExecutionsPage() {
  const { activeOrganization } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: executions, error, isLoading, mutate } = useSWR(
    activeOrganization ? ['/api/guards', activeOrganization.id] : null, 
    fetcher
  )

  const filteredExecutions = executions?.filter((exec: any) => {
    const query = searchQuery.toLowerCase()
    return (
      (exec.externalId?.toLowerCase() || '').includes(query) ||
      (exec.id?.toLowerCase() || '').includes(query) ||
      (exec.workflowId?.toLowerCase() || '').includes(query) ||
      (exec.monitor?.name?.toLowerCase() || '').includes(query)
    )
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-acid-lime animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
          Syncing Execution Memory...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Premium Header */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Shield className="w-48 h-48 text-acid-lime" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-12 relative z-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Guard <span className="text-acid-lime">Executions</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Audit the lifecycle of your AI agents. Real-time observability for
              idempotent side effects and state safety.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-card border border-border/10 shadow-2xl">
              <Shield className="w-5 h-5 text-acid-lime" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Active Protection
                </span>
                <span className="text-sm font-bold">
                  {executions?.length || 0} Jobs Logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <input 
              type="text" 
              placeholder="Search by Job ID, Workflow ID, or Monitor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-6 rounded-xl bg-foreground/[0.03] border border-border/10 focus:border-acid-lime/50 transition-all text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => mutate()}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/[0.03] border border-border/10 text-[10px] font-black uppercase tracking-widest hover:bg-foreground/[0.05] transition-all"
             >
               <RefreshCw className="w-3 h-3" />
               Refresh
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredExecutions?.map((execution: any, index: number) => (
            <Link key={execution.id} href={`/dashboard/guards/${execution.id}`}>
              <div
                className="group glass-panel border border-border/5 rounded-[2.5rem] p-8 hover:border-acid-lime/20 hover:shadow-2xl hover:shadow-acid-lime/5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto_auto] items-center gap-8">
                  {/* Status Indicator */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-all group-hover:scale-110 ${
                    execution.status === 'SUCCESS' 
                      ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime shadow-acid-lime/5' 
                      : execution.status === 'RUNNING'
                      ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400 animate-pulse'
                      : execution.status === 'UNKNOWN'
                      ? 'bg-orange-400/10 border-orange-400/20 text-orange-400 animate-pulse'
                      : 'bg-destructive/10 border-destructive/20 text-destructive shadow-destructive/5'
                  }`}>
                    {execution.status === 'SUCCESS' ? <CheckCircle2 className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-black uppercase tracking-tighter italic group-hover:text-acid-lime transition-colors">
                        {execution.externalId ||
                          `Session ${execution.id.slice(0, 8)}`}
                      </h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-foreground/5 text-muted-foreground uppercase tracking-widest">
                        Attempt {execution.attempt}
                      </span>
                      {execution.workflowId && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-acid-lime/10 border border-acid-lime/15 text-acid-lime uppercase tracking-wider">
                          WF: {execution.workflowId.slice(0, 8)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest italic opacity-60">
                        <Activity className="w-3 h-3 text-acid-lime" />
                        {execution.monitor.name}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest italic opacity-60">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(execution.startedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-12 px-8 border-x border-border/5">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-1">
                        Side Effects
                      </span>
                      <span className="text-lg font-black italic text-foreground">
                        {execution._count?.sideEffects || 0}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-acid-lime group-hover:text-primary-foreground transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
