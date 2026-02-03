'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Edit2,
  Trash2,
  Copy,
  ChevronRight
} from 'lucide-react'

interface Monitor {
  id: string
  name: string
  schedule: string
  status: 'up' | 'down' | 'degraded'
  uptime: number
  lastCheck: string
  token: string
  gracePeriod: string
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([
    {
      id: '1',
      name: 'Database Backup',
      schedule: 'Daily at 2 AM',
      status: 'up',
      uptime: 99.8,
      lastCheck: '5 minutes ago',
      token: 'hb_a1b2c3d4e5f6g7h8',
      gracePeriod: '5 minutes'
    },
    {
      id: '2',
      name: 'SSL Certificate Renewal',
      schedule: 'Weekly',
      status: 'up',
      uptime: 100,
      lastCheck: '2 hours ago',
      token: 'hb_i9j8k7l6m5n4o3p2',
      gracePeriod: '10 minutes'
    },
    {
      id: '3',
      name: 'Data Sync Job',
      schedule: 'Every 30 minutes',
      status: 'degraded',
      uptime: 98.5,
      lastCheck: '12 minutes ago',
      token: 'hb_q1w2e3r4t5y6u7i8',
      gracePeriod: '2 minutes'
    }
  ])

  const [expandedMonitor, setExpandedMonitor] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const stats = {
    totalMonitors: monitors.length,
    upMonitors: monitors.filter(m => m.status === 'up').length,
    degradedMonitors: monitors.filter(m => m.status === 'degraded').length,
    avgUptime: (monitors.reduce((sum, m) => sum + m.uptime, 0) / monitors.length).toFixed(1)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return { bg: 'bg-primary/10', text: 'text-primary', icon: CheckCircle }
      case 'down':
        return { bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertCircle }
      case 'degraded':
        return { bg: 'bg-accent/10', text: 'text-accent', icon: Clock }
      default:
        return { bg: 'bg-muted/10', text: 'text-muted-foreground', icon: Activity }
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Monitors</h1>
          <p className="text-muted-foreground">Manage and monitor your critical jobs</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          New Monitor
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Total Monitors</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalMonitors}</p>
            </div>
            <Activity className="w-8 h-8 text-primary/50" />
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Up & Running</p>
              <p className="text-2xl font-bold text-primary">{stats.upMonitors}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-primary/50" />
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Degraded</p>
              <p className="text-2xl font-bold text-accent">{stats.degradedMonitors}</p>
            </div>
            <Clock className="w-8 h-8 text-accent/50" />
          </div>
        </div>

        <div className="bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Avg Uptime</p>
              <p className="text-2xl font-bold text-primary">{stats.avgUptime}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary/50" />
          </div>
        </div>
      </div>

      {/* Monitors List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your Monitors</h2>

        {monitors.length === 0 ? (
          <div className="bg-secondary border border-border rounded-lg p-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No monitors yet</h3>
            <p className="text-muted-foreground mb-6">Create your first monitor to get started</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Create Monitor
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor) => {
              const statusConfig = getStatusColor(monitor.status)
              const Icon = statusConfig.icon
              const isExpanded = expandedMonitor === monitor.id

              return (
                <div
                  key={monitor.id}
                  className="bg-secondary border border-border rounded-lg transition hover:border-border/80"
                >
                  {/* Monitor Card Header */}
                  <button
                    onClick={() => setExpandedMonitor(isExpanded ? null : monitor.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-secondary/50 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <Icon className={`w-6 h-6 ${statusConfig.text} flex-shrink-0`} />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{monitor.name}</h3>
                        <p className="text-sm text-muted-foreground">{monitor.schedule}</p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                          <p className="font-semibold text-foreground">{monitor.uptime}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Check</p>
                          <p className="font-semibold text-foreground">{monitor.lastCheck}</p>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Monitor Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-border px-6 py-6 bg-background/30 space-y-6">
                      {/* Quick Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Status</p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg}`}>
                            <Icon className={`w-4 h-4 ${statusConfig.text}`} />
                            <span className={`text-sm font-medium ${statusConfig.text} capitalize`}>
                              {monitor.status}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Uptime</p>
                          <p className="font-semibold text-foreground">{monitor.uptime}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Grace Period</p>
                          <p className="font-semibold text-foreground">{monitor.gracePeriod}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Last Check</p>
                          <p className="font-semibold text-foreground">{monitor.lastCheck}</p>
                        </div>
                      </div>

                      {/* Token Section */}
                      <div className="bg-background border border-border rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">Heartbeat Token</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded border border-border truncate">
                            {monitor.token}
                          </code>
                          <button
                            onClick={() => copyToClipboard(monitor.token)}
                            className="p-2 hover:bg-secondary rounded transition text-muted-foreground hover:text-foreground"
                            title="Copy token"
                          >
                            {copiedToken === monitor.token ? (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use this token to send heartbeats: <span className="font-mono">curl https://stillup.io/hb/{monitor.token}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-border text-foreground hover:bg-secondary bg-transparent"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-border text-destructive hover:bg-destructive/10 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
