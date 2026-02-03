'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Calendar
} from 'lucide-react'

interface ActivityEvent {
  id: string
  monitorName: string
  type: 'success' | 'failure' | 'timeout' | 'alert'
  message: string
  timestamp: string
  duration?: string
  details?: string
}

export default function Activity() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'success' | 'failure' | 'timeout' | 'alert'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week')

  const [activities, setActivities] = useState<ActivityEvent[]>([
    {
      id: '1',
      monitorName: 'Database Backup',
      type: 'success',
      message: 'Heartbeat received successfully',
      timestamp: '2 minutes ago',
      duration: '2.3 seconds'
    },
    {
      id: '2',
      monitorName: 'SSL Certificate Renewal',
      type: 'success',
      message: 'Heartbeat received successfully',
      timestamp: '15 minutes ago',
      duration: '1.1 seconds'
    },
    {
      id: '3',
      monitorName: 'Data Sync Job',
      type: 'timeout',
      message: 'Heartbeat missed - Grace period exceeded',
      timestamp: '1 hour ago',
      details: 'Expected heartbeat at 12:00 PM, received at 1:05 PM'
    },
    {
      id: '4',
      monitorName: 'Database Backup',
      type: 'failure',
      message: 'Script failed with exit code 1',
      timestamp: '3 hours ago',
      details: 'Disk space full during backup'
    },
    {
      id: '5',
      monitorName: 'SSL Certificate Renewal',
      type: 'success',
      message: 'Heartbeat received successfully',
      timestamp: '1 day ago',
      duration: '0.8 seconds'
    },
    {
      id: '6',
      monitorName: 'Data Sync Job',
      type: 'alert',
      message: 'Pattern detected: High failure rate',
      timestamp: '2 days ago',
      details: 'Failed 3 times in the last 24 hours'
    },
    {
      id: '7',
      monitorName: 'Database Backup',
      type: 'success',
      message: 'Heartbeat received successfully',
      timestamp: '3 days ago',
      duration: '2.1 seconds'
    },
    {
      id: '8',
      monitorName: 'SSL Certificate Renewal',
      type: 'timeout',
      message: 'Heartbeat missed - Grace period exceeded',
      timestamp: '5 days ago',
      details: 'Expected heartbeat at 02:00 AM, not received'
    }
  ])

  const filteredActivities = activities.filter(activity => {
    if (selectedFilter === 'all') return true
    return activity.type === selectedFilter
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' }
      case 'failure':
        return { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' }
      case 'timeout':
        return { icon: Clock, color: 'text-accent', bg: 'bg-accent/10' }
      case 'alert':
        return { icon: AlertCircle, color: 'text-accent', bg: 'bg-accent/10' }
      default:
        return { icon: CheckCircle, color: 'text-foreground', bg: 'bg-secondary' }
    }
  }

  const typeColors = {
    success: { label: 'Success', color: 'bg-primary/20 text-primary border border-primary/30' },
    failure: { label: 'Failure', color: 'bg-destructive/20 text-destructive border border-destructive/30' },
    timeout: { label: 'Timeout', color: 'bg-accent/20 text-accent border border-accent/30' },
    alert: { label: 'Alert', color: 'bg-accent/20 text-accent border border-accent/30' }
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Activity Log</h1>
          <p className="text-muted-foreground">View all heartbeat events and system alerts</p>
        </div>
        <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary bg-transparent">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Event Type:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'success', 'failure', 'timeout', 'alert'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedFilter === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary border border-border text-foreground hover:border-border/80'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Time Period:</span>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                dateRange === range
                  ? 'bg-secondary border border-primary text-foreground'
                  : 'bg-secondary border border-border text-muted-foreground hover:border-border/80'
              }`}
            >
              {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="bg-secondary border border-border rounded-lg p-12 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">No activities match your current filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity, index) => {
              const typeConfig = getTypeIcon(activity.type)
              const TypeIcon = typeConfig.icon
              const typeLabel = typeColors[activity.type]

              return (
                <div
                  key={activity.id}
                  className="bg-secondary border border-border rounded-lg p-6 hover:border-border/80 transition"
                >
                  <div className="flex items-start gap-4">
                    {/* Timeline Connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.bg} flex-shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      {index < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-12 bg-border my-2" />
                      )}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{activity.monitorName}</h3>
                          <p className="text-sm text-muted-foreground">{activity.message}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${typeLabel.color}`}>
                            {typeLabel.label}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {activity.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* Duration or Details */}
                      {activity.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duration: <span className="font-medium text-foreground">{activity.duration}</span>
                        </p>
                      )}

                      {activity.details && (
                        <div className="mt-3 p-3 bg-background/50 border border-border/50 rounded text-xs text-muted-foreground">
                          {activity.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          Showing {filteredActivities.length} of {activities.length} events
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled className="border-border text-muted-foreground bg-transparent">
            Previous
          </Button>
          <Button variant="outline" disabled className="border-border text-muted-foreground bg-transparent">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
