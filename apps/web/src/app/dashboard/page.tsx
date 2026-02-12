'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Edit2,
  Trash2,
  Copy,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'

interface Monitor {
  id: string
  name: string
  intervalMinutes: number
  gracePeriodMinutes: number
  heartbeatToken: string
  heartbeatUrl: string
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED'
  lastHeartbeatAt: string | null
  createdAt: string
  totalHeartbeats?: number
  openIncidents?: number
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMonitor, setExpandedMonitor] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null)

  // Fetch monitors on component mount
  useEffect(() => {
    fetchMonitors()
  }, [])

  const fetchMonitors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:4000/api/monitors', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setMonitors(data.monitors || [])
      } else {
        console.error('Failed to fetch monitors')
      }
    } catch (error) {
      console.error('Error fetching monitors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMonitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:4000/api/monitors/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        setMonitors(monitors.filter((m) => m.id !== id))
      } else {
        alert('Failed to delete monitor')
      }
    } catch (error) {
      console.error('Error deleting monitor:', error)
      alert('Failed to delete monitor')
    }
  }

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const formatSchedule = (intervalMinutes: number): string => {
    if (intervalMinutes < 60) {
      return `Every ${intervalMinutes} minute${intervalMinutes > 1 ? 's' : ''}`
    } else if (intervalMinutes === 60) {
      return 'Every hour'
    } else if (intervalMinutes % 1440 === 0) {
      const days = intervalMinutes / 1440
      return `Every ${days} day${days > 1 ? 's' : ''}`
    } else if (intervalMinutes % 60 === 0) {
      const hours = intervalMinutes / 60
      return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      return `Every ${intervalMinutes} minutes`
    }
  }

  const formatLastCheck = (lastHeartbeatAt: string | null): string => {
    if (!lastHeartbeatAt) return 'Never'

    const diff = Date.now() - new Date(lastHeartbeatAt).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const stats = {
    totalMonitors: monitors.length,
    upMonitors: monitors.filter((m) => m.status === 'UP').length,
    degradedMonitors: monitors.filter((m) => m.status === 'DEGRADED').length,
    downMonitors: monitors.filter((m) => m.status === 'DOWN').length,
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'up':
        return { bg: 'bg-primary/10', text: 'text-primary', icon: CheckCircle }
      case 'down':
        return { bg: 'bg-destructive/10', text: 'text-destructive', icon: AlertCircle }
      case 'degraded':
      case 'paused':
        return { bg: 'bg-accent/10', text: 'text-accent', icon: Clock }
      default:
        return { bg: 'bg-muted/10', text: 'text-muted-foreground', icon: Activity }
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading monitors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Monitors</h1>
          <p className="text-muted-foreground">Manage and monitor your critical jobs</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
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
              <p className="text-muted-foreground text-sm mb-1">Down</p>
              <p className="text-2xl font-bold text-destructive">{stats.downMonitors}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-destructive/50" />
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
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
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
                        <p className="text-sm text-muted-foreground">
                          {formatSchedule(monitor.intervalMinutes)}
                        </p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <p className="font-semibold text-foreground">{monitor.status}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Check</p>
                          <p className="font-semibold text-foreground">
                            {formatLastCheck(monitor.lastHeartbeatAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition ${isExpanded ? 'rotate-90' : ''}`}
                    />
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
                          <p className="text-xs text-muted-foreground mb-2">Interval</p>
                          <p className="font-semibold text-foreground">
                            {monitor.intervalMinutes} min
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Grace Period</p>
                          <p className="font-semibold text-foreground">
                            {monitor.gracePeriodMinutes} min
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Last Check</p>
                          <p className="font-semibold text-foreground">
                            {formatLastCheck(monitor.lastHeartbeatAt)}
                          </p>
                        </div>
                      </div>

                      {/* Token Section */}
                      <div className="bg-background border border-border rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">Heartbeat Token</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded border border-border truncate">
                            {monitor.heartbeatToken}
                          </code>
                          <button
                            onClick={() => copyToClipboard(monitor.heartbeatToken)}
                            className="p-2 hover:bg-secondary rounded transition text-muted-foreground hover:text-foreground"
                            title="Copy token"
                          >
                            {copiedToken === monitor.heartbeatToken ? (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            ) : (
                              <Copy className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use this token to send heartbeats:{' '}
                          <span className="font-mono">curl {monitor.heartbeatUrl}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMonitor(monitor)
                            setShowEditModal(true)
                          }}
                          className="gap-2 border-border text-foreground hover:bg-secondary bg-transparent"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMonitor(monitor.id)}
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

      {/* Create Monitor Modal */}
      {showCreateModal && (
        <CreateMonitorModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchMonitors()
          }}
        />
      )}

      {/* Edit Monitor Modal */}
      {showEditModal && editingMonitor && (
        <EditMonitorModal
          monitor={editingMonitor}
          onClose={() => {
            setShowEditModal(false)
            setEditingMonitor(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setEditingMonitor(null)
            fetchMonitors()
          }}
        />
      )}
    </div>
  )
}

// Create Monitor Modal Component
function CreateMonitorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [intervalMinutes, setIntervalMinutes] = useState(60)
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:4000/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          intervalMinutes,
          gracePeriodMinutes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create monitor')
      }
    } catch (err) {
      setError('Failed to create monitor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary border border-border rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Create Monitor</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Monitor Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Database Backup"
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="interval">Expected Interval (minutes)</Label>
            <Input
              id="interval"
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
              min="1"
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How often should this job run?
            </p>
          </div>

          <div>
            <Label htmlFor="grace">Grace Period (minutes)</Label>
            <Input
              id="grace"
              type="number"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value))}
              min="0"
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Extra time allowed before alerting
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Monitor'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Monitor Modal Component
function EditMonitorModal({
  monitor,
  onClose,
  onSuccess,
}: {
  monitor: Monitor
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(monitor.name)
  const [intervalMinutes, setIntervalMinutes] = useState(monitor.intervalMinutes)
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(monitor.gracePeriodMinutes)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`http://localhost:4000/api/monitors/${monitor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          intervalMinutes,
          gracePeriodMinutes,
        }),
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update monitor')
      }
    } catch (err) {
      setError('Failed to update monitor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary border border-border rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Edit Monitor</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Monitor Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="edit-interval">Expected Interval (minutes)</Label>
            <Input
              id="edit-interval"
              type="number"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
              min="1"
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <Label htmlFor="edit-grace">Grace Period (minutes)</Label>
            <Input
              id="edit-grace"
              type="number"
              value={gracePeriodMinutes}
              onChange={(e) => setGracePeriodMinutes(parseInt(e.target.value))}
              min="0"
              required
              disabled={isLoading}
              className="bg-background border-border text-foreground"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Monitor'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
