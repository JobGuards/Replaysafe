'use client'

import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function Analytics() {
  const timeRanges = ['7d', '30d', '90d', '1y'] as const
  const selectedRange = '30d'

  const analyticsData = {
    uptime: 99.8,
    totalRequests: 45230,
    failureRate: 0.2,
    avgResponseTime: 1.23,
    peakHour: '2:00 AM',
    recoveryTime: '2m 34s'
  }

  const uptimeByDay = [
    { day: 'Mon', uptime: 100 },
    { day: 'Tue', uptime: 99.9 },
    { day: 'Wed', uptime: 99.5 },
    { day: 'Thu', uptime: 100 },
    { day: 'Fri', uptime: 99.8 },
    { day: 'Sat', uptime: 99.2 },
    { day: 'Sun', uptime: 100 }
  ]

  const failurePatterns = [
    { pattern: 'Timeout after 5 min', occurrences: 12, lastSeen: '2 days ago', likelihood: 'High' },
    { pattern: 'Disk space full', occurrences: 8, lastSeen: '5 days ago', likelihood: 'Medium' },
    { pattern: 'Network error', occurrences: 5, lastSeen: '1 week ago', likelihood: 'Low' },
    { pattern: 'Permission denied', occurrences: 3, lastSeen: '2 weeks ago', likelihood: 'Low' }
  ]

  const insights = [
    {
      type: 'warning',
      title: 'Recurring Timeout Pattern',
      description: 'Database backups timeout every Saturday around 2 AM. Consider increasing grace period.',
      action: 'View Monitor'
    },
    {
      type: 'success',
      title: 'Improved Stability',
      description: 'Uptime increased by 2.3% compared to last month. Great work!',
      action: null
    },
    {
      type: 'info',
      title: 'Peak Activity Time',
      description: 'Most heartbeats received between 1-3 AM. Consider scheduling maintenance windows accordingly.',
      action: null
    }
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">Analytics</h1>
          <p className="text-muted-foreground text-lg mt-1">Insights, trends, and failure patterns</p>
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
          title="Avg Uptime" 
          value={`${analyticsData.uptime}%`} 
          trend="+0.2%" 
          positive 
          icon={<TrendingUp className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Total Heartbeats" 
          value={analyticsData.totalRequests.toLocaleString()} 
          trend="+12%" 
          positive 
          icon={<BarChart3 className="w-4 h-4" />} 
        />
        <MetricCard 
          title="Failure Rate" 
          value={`${analyticsData.failureRate}%`} 
          trend="-5%" 
          positive={false} 
          icon={<AlertCircle className="w-4 h-4" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Uptime Chart */}
        <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight">Uptime Distribution</h2>
          <div className="space-y-6">
            {uptimeByDay.map((day) => (
              <div key={day.day} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{day.day}</span>
                  <span className={`text-sm font-black ${day.uptime === 100 ? 'text-acid-lime' : 'text-orange-500'}`}>
                    {day.uptime}%
                  </span>
                </div>
                <div className="h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${day.uptime === 100 ? 'bg-acid-lime shadow-[0_0_10px_rgba(var(--theme-lime-rgb),0.5)]' : 'bg-orange-500'}`}
                    style={{ width: `${day.uptime}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">System Insights</h2>
          <div className="flex flex-col gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`glass-panel rounded-2xl p-6 border-l-4 transition-all hover:-translate-x-1 ${
                  insight.type === 'warning'
                    ? 'border-orange-500 bg-orange-500/5'
                    : insight.type === 'success'
                      ? 'border-acid-lime bg-acid-lime/5'
                      : 'border-primary bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                    insight.type === 'success' ? 'bg-acid-lime/10 text-acid-lime' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {insight.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                    {insight.type === 'success' && <CheckCircle className="w-5 h-5" />}
                    {insight.type === 'info' && <TrendingUp className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <button className="mt-4 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1 group">
                        <span className={insight.type === 'warning' ? 'text-orange-500' : 'text-acid-lime'}>
                          {insight.action}
                        </span>
                        <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failure Patterns */}
      <div className="glass-panel border border-border/10 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-black text-foreground mb-8 uppercase tracking-tight">Recurring failure patterns</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border/10">
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pattern</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">Count</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-center text-muted-foreground">Last Seen</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-right text-muted-foreground">Likelihood</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {failurePatterns.map((pattern, index) => (
                <tr key={index} className="group">
                  <td className="py-4">
                    <p className="font-bold text-foreground group-hover:text-acid-lime transition-colors">{pattern.pattern}</p>
                  </td>
                  <td className="py-4 text-center">
                    <p className="text-sm font-medium text-foreground">{pattern.occurrences}x</p>
                  </td>
                  <td className="py-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase font-medium">{pattern.lastSeen}</p>
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        pattern.likelihood === 'High'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20'
                          : pattern.likelihood === 'Medium'
                            ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                            : 'bg-acid-lime/10 text-acid-lime border border-acid-lime/20'
                      }`}
                    >
                      {pattern.likelihood}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
      <div className="glass-panel border border-border/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl bg-acid-lime/5">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-black text-foreground mb-1 uppercase tracking-tight">Export Intelligence</h3>
          <p className="text-muted-foreground">Generate a PDF report of your system's performance and failure trends.</p>
        </div>
        <Button className="bg-foreground text-background hover:opacity-90 h-12 px-8 rounded-xl font-black uppercase tracking-widest flex items-center gap-3">
          <Download className="w-4 h-4" />
          Download Report
        </Button>
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
