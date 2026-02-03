'use client'

import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  Download
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
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Analytics</h1>
          <p className="text-muted-foreground">Insights, trends, and failure patterns</p>
        </div>
        <div className="flex gap-2">
          {timeRanges.map(range => (
            <Button
              key={range}
              variant={selectedRange === range ? 'default' : 'outline'}
              size="sm"
              className={
                selectedRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:bg-secondary'
              }
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Uptime</h3>
            <TrendingUp className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold text-primary mb-2">{analyticsData.uptime}%</p>
          <p className="text-xs text-muted-foreground">Excellent performance this month</p>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Requests</h3>
            <BarChart3 className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{analyticsData.totalRequests.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">+12% from last period</p>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Failure Rate</h3>
            <AlertCircle className="w-5 h-5 text-accent/50" />
          </div>
          <p className="text-3xl font-bold text-accent mb-2">{analyticsData.failureRate}%</p>
          <p className="text-xs text-muted-foreground">Very low - excellent reliability</p>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Response Time</h3>
            <Calendar className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{analyticsData.avgResponseTime}s</p>
          <p className="text-xs text-muted-foreground">Peak: {analyticsData.peakHour}</p>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Recovery Time</h3>
            <CheckCircle className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{analyticsData.recoveryTime}</p>
          <p className="text-xs text-muted-foreground">After failure detection</p>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">MTTR Trend</h3>
            <TrendingUp className="w-5 h-5 text-primary/50" />
          </div>
          <p className="text-3xl font-bold text-primary mb-2">-15%</p>
          <p className="text-xs text-muted-foreground">Improved from last month</p>
        </div>
      </div>

      {/* Uptime Chart */}
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Uptime by Day</h2>
        <div className="space-y-4">
          {uptimeByDay.map((day) => (
            <div key={day.day} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{day.day}</span>
                <span className={`text-sm font-semibold ${day.uptime === 100 ? 'text-primary' : 'text-accent'}`}>
                  {day.uptime}%
                </span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${day.uptime === 100 ? 'bg-primary' : 'bg-accent'}`}
                  style={{ width: `${day.uptime}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Failure Patterns */}
      <div className="bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Detected Failure Patterns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Pattern</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Occurrences</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Last Seen</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Likelihood</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {failurePatterns.map((pattern, index) => (
                <tr key={index} className="hover:bg-background/50 transition">
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">{pattern.pattern}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-foreground">{pattern.occurrences}x</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <p className="text-muted-foreground">{pattern.lastSeen}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        pattern.likelihood === 'High'
                          ? 'bg-destructive/20 text-destructive'
                          : pattern.likelihood === 'Medium'
                            ? 'bg-accent/20 text-accent'
                            : 'bg-primary/20 text-primary'
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

      {/* AI Insights */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-lg p-6 border ${
              insight.type === 'warning'
                ? 'bg-accent/10 border-accent/30'
                : insight.type === 'success'
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-blue-500/10 border-blue-500/30'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-0.5">
                {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-accent" />}
                {insight.type === 'success' && <CheckCircle className="w-5 h-5 text-primary" />}
                {insight.type === 'info' && <TrendingUp className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                {insight.action && (
                  <button className="text-sm font-medium hover:underline">
                    {insight.action === 'View Monitor' ? (
                      <span className={insight.type === 'warning' ? 'text-accent' : 'text-primary'}>
                        {insight.action}
                      </span>
                    ) : (
                      insight.action
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div className="bg-secondary border border-border rounded-lg p-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground mb-1">Export Analytics</h3>
          <p className="text-sm text-muted-foreground">Download detailed analytics report for this period</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  )
}
