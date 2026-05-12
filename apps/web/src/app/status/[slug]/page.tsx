'use client'

import React from 'react'
import useSWR from 'swr'
import { useParams } from 'next/navigation'
import { Activity, ShieldCheck, Zap, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen bg-background selection:bg-acid-lime selection:text-primary-foreground p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-b border-border/10 pb-12">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
              <ShieldCheck className="w-5 h-5 text-acid-lime" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Verified by StillUp</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">{project.name}</h1>
            <p className="text-muted-foreground text-lg mt-2 font-medium">Real-time infrastructure health and performance</p>
          </div>
          
          <div className={`px-8 py-6 rounded-[2rem] border-2 transition-all duration-500 shadow-2xl flex items-center gap-6 ${
            allOperational ? 'bg-acid-lime/5 border-acid-lime/20 shadow-acid-lime/10' : 'bg-destructive/5 border-destructive/20 shadow-destructive/10'
          }`}>
            <div className={`w-4 h-4 rounded-full animate-ping ${allOperational ? 'bg-acid-lime' : 'bg-destructive'}`} />
            <span className={`text-2xl font-black uppercase tracking-widest ${allOperational ? 'text-acid-lime' : 'text-destructive'}`}>
              {allOperational ? 'All Systems Operational' : 'Degraded Performance'}
            </span>
          </div>
        </div>

        {/* Monitor Grid */}
        <div className="grid grid-cols-1 gap-6">
          {project.monitors.map((monitor: any) => (
            <div key={monitor.id} className="glass-panel border border-border/10 rounded-[2.5rem] p-8 shadow-xl flex flex-col md:flex-row items-center gap-8 group hover:border-acid-lime/30 transition-all duration-500">
              <div className="flex-shrink-0">
                <HealthScoreBadge 
                  score={monitor.healthScore || 100} 
                  status={monitor.healthScore > 90 ? 'optimal' : monitor.healthScore > 70 ? 'warning' : 'critical'} 
                />
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tighter group-hover:text-acid-lime transition-colors">
                    {monitor.name}
                  </h2>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    monitor.status === 'UP' ? 'bg-acid-lime/10 text-acid-lime' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {monitor.status === 'UP' ? 'Operational' : 'Incident'}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 opacity-60">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Health: {monitor.healthScore || 100}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Last Check: {new Date(monitor.lastHeartbeatAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-24 pb-12 text-center">
          <p className="text-muted-foreground text-sm font-medium">
            Powered by <span className="text-foreground font-black uppercase tracking-widest hover:text-acid-lime cursor-pointer transition-colors">StillUp Intelligence</span>
          </p>
        </div>
      </div>
    </div>
  )
}
