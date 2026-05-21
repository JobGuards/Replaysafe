'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { Activity, ShieldCheck, Zap, AlertCircle, RefreshCw } from 'lucide-react'
import { HealthScoreBadge } from '@/components/analytics/HealthScoreBadge'

export default function PublicStatusPage() {
  const { slug } = useParams()
  
  const { data: project, error, isLoading } = useSWR(`/api/public/status/${slug}`, () => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4040'}/api/public/status/${slug}`).then(res => {
      if (!res.ok) throw new Error('Not Found')
      return res.json()
    })
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <Activity className="w-12 h-12 text-acid-lime animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] animate-pulse">Loading Intelligence...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6">
        <div className="p-6 bg-destructive/10 rounded-3xl border border-destructive/20 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Status Page Not Found</h1>
          <p className="text-muted-foreground mt-2">The status page you are looking for does not exist or is private.</p>
        </div>
      </div>
    )
  }

  const allOperational = project.monitors.every((m: any) => m.status === 'UP')

  return (
    <div className="min-h-screen bg-background selection:bg-acid-lime selection:text-primary-foreground p-6 sm:p-12 font-inter">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-border/10 pb-12">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <ShieldCheck className="w-5 h-5 text-acid-lime" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Sovereign Sentinel Active</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic">{project.name}</h1>
            <p className="text-muted-foreground text-lg mt-2 font-medium">Autonomous Infrastructure Status</p>
          </div>
          
          <div className={`px-8 py-6 rounded-[2rem] border-2 transition-all duration-500 shadow-2xl flex items-center gap-6 ${
            allOperational ? 'bg-acid-lime/5 border-acid-lime/20 shadow-acid-lime/10' : 'bg-destructive/5 border-destructive/20 shadow-destructive/10'
          }`}>
            <div className={`w-4 h-4 rounded-full animate-ping ${allOperational ? 'bg-acid-lime' : 'bg-destructive'}`} />
            <span className={`text-2xl font-black uppercase tracking-widest ${allOperational ? 'text-acid-lime' : 'text-destructive'}`}>
              {allOperational ? 'All Systems Operational' : 'Systems Under Stress'}
            </span>
          </div>
        </div>

        {/* Phase 5: Memory-Aware Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-acid-lime/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-12 h-12 text-acid-lime" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-acid-lime mb-4">Retry Safety</div>
            <div className="text-5xl font-black text-foreground mb-2">{project.stats.retrySafety}%</div>
            <p className="text-xs text-muted-foreground font-medium">Replay-safe execution and side-effect deduplication across all autonomous retries.</p>
          </div>

          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <RefreshCw className="w-12 h-12 text-blue-500" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-4">Rollback Health</div>
            <div className="text-5xl font-black text-foreground mb-2">{project.stats.rollbackHealth}%</div>
            <p className="text-xs text-muted-foreground font-medium">Success rate of automated compensation hooks during job failures.</p>
          </div>

          <div className="glass-panel border border-border/10 rounded-[2.5rem] p-8 bg-foreground/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-12 h-12 text-acid-lime" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-4">Active Sentinels</div>
            <div className="text-5xl font-black text-foreground mb-2">{project.monitors.length}</div>
            <p className="text-xs text-muted-foreground font-medium">Independent monitoring nodes observing your infrastructure.</p>
          </div>
        </div>

        {/* Monitor Grid */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 px-4 italic">Infrastructure Memory</h2>
          <div className="grid grid-cols-1 gap-6">
            {project.monitors.map((monitor: any) => (
              <div key={monitor.id} className="glass-panel border border-border/10 rounded-[3rem] p-10 shadow-xl group hover:border-acid-lime/30 transition-all duration-500">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                  <div className="flex-shrink-0">
                    <HealthScoreBadge 
                      score={monitor.healthScore || 100} 
                      status={monitor.healthScore > 90 ? 'optimal' : monitor.healthScore > 70 ? 'warning' : 'critical'} 
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className="text-4xl font-black text-foreground uppercase tracking-tighter italic">
                          {monitor.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                           <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            monitor.status === 'UP' ? 'bg-acid-lime/10 text-acid-lime border border-acid-lime/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}>
                            {monitor.status === 'UP' ? 'System Operational' : 'Incident Detected'}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                            Pulse: {monitor.healthScore}%
                          </span>
                        </div>

                        {/* Regional Sentinels (Phase 5) */}
                        {monitor.regionalStatus && Object.keys(monitor.regionalStatus).length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-4">
                            {Object.entries(monitor.regionalStatus).map(([region, data]: [string, any]) => (
                              <div key={region} className="flex items-center gap-2 px-3 py-1 bg-foreground/[0.03] rounded-lg border border-border/5 group/region">
                                <div className={`w-1.5 h-1.5 rounded-full ${data.status === 'UP' ? 'bg-acid-lime' : 'bg-destructive'} ${data.status === 'UP' ? 'animate-pulse' : ''}`} />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">{region}</span>
                                <span className="text-[9px] font-medium text-muted-foreground/30">{data.latency}ms</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right hidden md:block">
                        <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1 italic">Last Heartbeat</div>
                        <div className="text-lg font-black text-foreground">{new Date(monitor.lastHeartbeatAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    {/* Incident Timeline */}
                    {monitor.incidents && monitor.incidents.length > 0 && (
                      <div className="pt-8 border-t border-border/5 space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-4">Recent Incident Memory</div>
                        <div className="space-y-3">
                          {monitor.incidents.map((incident: any) => (
                            <div key={incident.id} className="flex items-center justify-between p-4 bg-foreground/[0.02] rounded-2xl border border-border/5 hover:bg-foreground/[0.04] transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${incident.resolvedAt ? 'bg-blue-500' : 'bg-destructive animate-pulse'}`} />
                                <span className="text-xs font-bold text-foreground uppercase tracking-tight">{incident.type}</span>
                              </div>
                              <div className="flex items-center gap-6 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                                <span>{new Date(incident.startedAt).toLocaleDateString()}</span>
                                <span className="px-3 py-1 bg-foreground/5 rounded-lg border border-border/5">
                                  {incident.resolvedAt ? 'Self-Healed' : 'Active'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-24 pb-12 flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 animate-bounce">
            <Zap className="w-6 h-6 text-acid-lime" />
          </div>
          <p className="text-muted-foreground text-sm font-medium text-center max-w-md">
            All monitors are cryptographically verified. Replaysafe provides <span className="text-foreground font-black italic">Execution Sovereignty</span> for autonomous systems.
          </p>
        </div>
      </div>
    </div>
  )
}
