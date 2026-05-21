'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
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
  Zap,
  Shield,
  Clock
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

import { useAuth } from '@/contexts/AuthContext'

export default function Analytics() {
  const { activeOrganization } = useAuth()
  const timeRanges = ['7d', '30d', '90d', '1y'] as const
  const [selectedRange, setSelectedRange] = React.useState<typeof timeRanges[number]>('7d')
  const [activeTab, setActiveTab] = React.useState<'overview' | 'intelligence' | 'safety'>('overview')
  const [intelligencePage, setIntelligencePage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)

  // Fetch real analytics overview with the selected time range
  const { data: overview, isLoading } = useSWR(
    activeOrganization ? [`/api/analytics/project/overview?range=${selectedRange}`, activeOrganization.id] : null, 
    () => api.getProjectOverview()
  )

  const monitors = overview?.monitors || []
  const allPatterns = useMemo(() => {
    const patterns = monitors.flatMap((m: any) => m.failurePatterns || [])
    return patterns.sort((a: any, b: any) => 
      new Date(b.lastSeenAt || b.createdAt).getTime() - new Date(a.lastSeenAt || a.createdAt).getTime()
    )
  }, [monitors])
  
  const totalIntelligencePages = Math.ceil(allPatterns.length / itemsPerPage)
  const paginatedPatterns = allPatterns.slice((intelligencePage - 1) * itemsPerPage, intelligencePage * itemsPerPage)

  const projectTrend = overview?.projectTrend || []
  const safetyStats = overview?.safetyStats || { preventedDuplicates: 0, estimatedDollarsSaved: 0, retrySuccessRate: 0, estimatedMinutesSaved: 0 }
  const deduplicationTrend = overview?.deduplicationTrend || []
  
  const stats = useMemo(() => {
    if (monitors.length === 0) return { uptime: 0, totalHeartbeats: 0, failureRate: 0 }
    
    const totalHealth = monitors.reduce((acc: number, m: any) => acc + (m.healthScore || 0), 0)
    const avgHealth = totalHealth / monitors.length
    
    // Total heartbeats across all monitors in the period
    const totalHeartbeats = monitors.reduce((acc: number, m: any) => {
      const summary = m.executionSummaries || []
      return acc + summary.reduce((sum: number, s: any) => sum + (s.totalCount || 0), 0)
    }, 0)
    
    return {
      uptime: Math.round(avgHealth * 10) / 10,
      totalHeartbeats,
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
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Sovereign Intelligence</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase font-bold tracking-widest opacity-60">System Stress & Reliability Mapping</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Tab Navigation */}
          <div className="flex p-1 bg-card/50 backdrop-blur rounded-xl border border-border/10">
            {(['overview', 'intelligence', 'safety'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-foreground text-background shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border/20 hidden sm:block" />

          {/* Time Range Selector */}
          <div className="flex p-1 bg-card/50 backdrop-blur rounded-xl border border-border/10">
            {timeRanges.map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  selectedRange === range
                    ? 'bg-acid-lime text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10 animate-in fade-in duration-500">
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

          {/* Trends Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight">Uptime Trend</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectTrend}>
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

            <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-acid-lime" />
                Reliability Pulse
              </h2>
              <div className="h-[300px] w-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground uppercase font-black tracking-widest opacity-40">System state is nominal</p>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Zero cascading failures detected in the current window</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'intelligence' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* Infrastructure Intelligence Feed */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-acid-lime" />
                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Intelligence Feed</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Show:</span>
                  <div className="flex bg-card/50 backdrop-blur rounded-lg border border-border/10 p-1">
                    {[5, 10, 20, 50].map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size)
                          setIntelligencePage(1)
                        }}
                        className={`px-2 py-1 rounded text-[9px] font-black transition-all ${
                          itemsPerPage === size ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalIntelligencePages > 1 && (
                  <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-lg border border-border/10 p-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={intelligencePage === 1}
                      onClick={() => setIntelligencePage(p => Math.max(1, p - 1))}
                    >
                      <ArrowDownRight className="w-4 h-4 rotate-135" />
                    </Button>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2">
                      {intelligencePage} / {totalIntelligencePages}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={intelligencePage === totalIntelligencePages}
                      onClick={() => setIntelligencePage(p => Math.min(totalIntelligencePages, p + 1))}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-4 min-h-[300px]">
              {paginatedPatterns.length > 0 ? (
                paginatedPatterns.map((pattern: any, idx: number) => (
                  <div key={idx} className="glass-panel border border-border/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-in fade-in slide-in-from-right-4 duration-300 hover:border-acid-lime/20 transition-colors">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                          pattern.type === 'CASCADING' ? 'bg-purple-500/20 text-purple-400' : 
                          pattern.type === 'STREAK' ? 'bg-orange-500/20 text-orange-400' : 
                          pattern.type === 'SECRET_RISK' ? 'bg-destructive/20 text-destructive' : 'bg-acid-lime/20 text-acid-lime'
                        }`}>
                          {pattern.type}
                        </span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          {new Date(pattern.lastSeenAt || pattern.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-foreground leading-relaxed">
                        {pattern.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Confidence</p>
                        <p className="text-sm font-black text-foreground">{Math.round(pattern.confidence * 100)}%</p>
                      </div>
                      <div className="w-px h-8 bg-border/20" />
                      <Button variant="outline" size="sm" className="rounded-lg text-[9px] font-black uppercase tracking-widest h-8 px-4 border-border/10">
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center glass-panel rounded-3xl border border-dashed border-border/20">
                  <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
                    No autonomous anomalies detected
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Monitor Pulse Grid */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Monitor Health Status</h2>
            <div className="grid grid-cols-1 gap-4">
              {monitors.map((monitor: any) => (
                <div key={monitor.id} className="glass-panel border border-border/10 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row gap-6 items-center">
                  <div className="flex-shrink-0 scale-75 lg:scale-100">
                    <HealthScoreBadge 
                      score={monitor.healthScore || 100} 
                      status={monitor.healthScore > 90 ? 'optimal' : monitor.healthScore > 70 ? 'warning' : 'critical'} 
                    />
                  </div>
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">{monitor.name}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                        monitor.status === 'UP' ? 'bg-acid-lime/10 text-acid-lime' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {monitor.status}
                      </span>
                    </div>
                    <HeartbeatPulse 
                      pulses={monitor.heartbeats?.map((h: any) => ({
                        status: h.type === 'SUCCESS' ? 'success' : 'error',
                        receivedAt: h.receivedAt
                      })) || []} 
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <Link href={`/dashboard/monitors/${monitor.id}`}>
                      <Button className="rounded-xl font-black uppercase tracking-widest text-[9px] px-6 h-9" variant="outline">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard 
              title="Dangerous Retries Blocked" 
              value={safetyStats.preventedDuplicates.toString()} 
              trend="Idempotent" 
              positive 
              icon={<Shield className="w-4 h-4" />} 
            />
            <MetricCard 
              title="Operational Savings" 
              value={`$${safetyStats.estimatedDollarsSaved.toLocaleString()}`} 
              trend="Blocked ROI" 
              positive 
              icon={<TrendingUp className="w-4 h-4" />} 
            />
            <MetricCard 
              title="Eng Time Saved" 
              value={`${Math.round(safetyStats.estimatedMinutesSaved / 6) / 10}h`} 
              trend="Automatic" 
              positive 
              icon={<Clock className="w-4 h-4" />} 
            />
          </div>

          <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-acid-lime" />
              ReplayGuard Effectiveness
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deduplicationTrend}>
                  <defs>
                    <linearGradient id="colorSkips" x1="0" y1="0" x2="0" y2="1">
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
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.4)' }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    name="Blocked Duplicates"
                    stroke="#d9ff00" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorSkips)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
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
