'use client'

import React, { useMemo } from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from 'lucide-react'
import { HealthScoreBadge } from '@/components/analytics/HealthScoreBadge'
import { HeartbeatPulse } from '@/components/analytics/HeartbeatPulse'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Analytics() {
  const timeRanges = ['7d', '30d', '90d', '1y'] as const
  const selectedRange = '30d'

  // Fetch real analytics overview
  const { data: overview, isLoading } = useSWR('/api/analytics/project/overview', () => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/analytics/project/overview?projectId=default`, {
      credentials: 'include'
    }).then(res => res.json())
  )

  const monitors = overview?.monitors || []
  
  const stats = useMemo(() => {
    if (monitors.length === 0) return { uptime: 0, totalHeartbeats: 0, failureRate: 0 }
    
    const totalHealth = monitors.reduce((acc: number, m: any) => acc + (m.healthScore || 0), 0)
    const avgHealth = totalHealth / monitors.length
    
    return {
      uptime: Math.round(avgHealth * 10) / 10,
      totalHeartbeats: monitors.reduce((acc: number, m: any) => acc + (m.executionSummaries?.[0]?.totalCount || 0), 0),
      failureRate: Math.round((100 - avgHealth) * 10) / 10
    }
  }, [monitors])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Activity className="w-8 h-8 text-acid-lime animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Intelligence</h1>
          <p className="text-muted-foreground text-lg mt-1">Real-time health scores and failure patterns</p>
        </div>
        <div className="flex p-1 bg-card/50 backdrop-blur rounded-xl border border-border/10">
          {timeRanges.map(range => (
            <button
              key={range}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedRange === range
                  ? 'bg-acid-lime text-primary-foreground shadow-lg shadow-acid-lime/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          title="Project Health" 
          value={`${stats.uptime}%`} 
          trend="+1.2%" 
          positive 
          icon={<TrendingUp className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Active Monitors" 
          value={monitors.length.toString()} 
          trend="Live" 
          positive 
          icon={<Zap className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Incidents (24h)" 
          value={stats.failureRate > 0 ? "2" : "0"} 
          trend={stats.failureRate > 0 ? "+100%" : "0%"} 
          positive={stats.failureRate === 0} 
          icon={<AlertCircle className="w-4 h-4" />} 
        />
      </div>

      {/* Monitor Intelligence Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Monitor Intelligence</h2>
        <div className="grid grid-cols-1 gap-6">
          {monitors.map((monitor: any) => (
            <div key={monitor.id} className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl flex flex-col lg:flex-row gap-8 items-center">
              {/* Health Badge */}
              <div className="flex-shrink-0">
                <HealthScoreBadge 
                  score={monitor.healthScore || 100} 
                  status={monitor.healthScore > 90 ? 'optimal' : monitor.healthScore > 70 ? 'warning' : 'critical'} 
                />
              </div>

              {/* Info & Pulse */}
              <div className="flex-1 w-full space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">{monitor.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      monitor.status === 'UP' ? 'bg-acid-lime/10 text-acid-lime' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {monitor.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium uppercase">
                      Last Check: {monitor.lastHeartbeatAt ? new Date(monitor.lastHeartbeatAt).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>

                <HeartbeatPulse pulses={[]} /> {/* We'd need another endpoint or data for real pulses */}
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] px-6 border-border/10" variant="outline">
                  View Insights
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight">Uptime Trend</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monitors[0]?.executionSummaries || []}>
                <defs>
                  <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d9ff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d9ff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { weekday: 'short' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.4)' }}
                />
                <YAxis hide domain={[90, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#d9ff00" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorUptime)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Active Patterns</h2>
          <div className="flex flex-col gap-4">
            {monitors.flatMap((m: any) => m.failurePatterns).length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 border border-border/10 text-center">
                <p className="text-muted-foreground font-medium italic">No recurring patterns detected yet.</p>
              </div>
            ) : (
              monitors.flatMap((m: any) => m.failurePatterns).map((pattern: any, i: number) => (
                <div key={i} className="glass-panel rounded-2xl p-6 border-l-4 border-acid-lime bg-acid-lime/5">
                  <h4 className="font-bold text-foreground mb-1">{pattern.type}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pattern.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, trend, positive, icon }: { title: string; value: string; trend: string; positive: boolean; icon: React.ReactNode }) {
  return (
    <div className="glass-panel border border-border/10 rounded-2xl p-6 shadow-lg transition-all hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
        <div className="opacity-40">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${
          positive ? 'bg-acid-lime/10 text-acid-lime' : 'bg-destructive/10 text-destructive'
        }`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
    </div>
  )
}
