'use client'

import React from 'react'
import { Shield, Zap, Activity, Clock, Key } from 'lucide-react'
import { HealthScoreBadge } from './HealthScoreBadge'
import { HeartbeatPulse } from './HeartbeatPulse'

interface TunnelStatusCardProps {
  monitor: {
    id: string
    name: string
    status: 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED'
    healthScore: number
    config?: any
    lastHeartbeat?: {
      latency?: number
      handshakeAge?: number
      receivedAt: string
    }
  }
}

export function TunnelStatusCard({ monitor }: TunnelStatusCardProps) {
  const isStale = monitor.lastHeartbeat?.handshakeAge && monitor.lastHeartbeat.handshakeAge > 300
  const isSlow = monitor.lastHeartbeat?.latency && monitor.lastHeartbeat.latency > 1000

  return (
    <div className="glass-panel border border-border/10 rounded-3xl p-8 bg-card/5 hover:border-acid-lime/30 transition-all group">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${monitor.status === 'UP' ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight italic">{monitor.name}</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Secure Tunnel (WireGuard)</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <MetricBadge 
              icon={<Activity className="w-3 h-3" />} 
              label="Latency" 
              value={monitor.lastHeartbeat?.latency ? `${monitor.lastHeartbeat.latency}ms` : 'N/A'}
              status={isSlow ? 'warning' : 'ok'}
            />
            <MetricBadge 
              icon={<Clock className="w-3 h-3" />} 
              label="Handshake" 
              value={monitor.lastHeartbeat?.handshakeAge ? `${Math.floor(monitor.lastHeartbeat.handshakeAge / 60)}m ago` : 'N/A'}
              status={isStale ? 'error' : 'ok'}
            />
            <MetricBadge 
              icon={<Key className="w-3 h-3" />} 
              label="Key Safety" 
              value="Secure"
              status="ok"
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <HealthScoreBadge score={monitor.healthScore} />
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className={`w-2 h-2 rounded-full animate-pulse ${monitor.status === 'UP' ? 'bg-acid-lime' : 'bg-destructive'}`} />
            {monitor.status}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Network Pulse (24h)</span>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-acid-lime" />
            <span className="text-[10px] font-bold text-acid-lime uppercase tracking-widest">Real-time</span>
          </div>
        </div>
        <HeartbeatPulse monitorId={monitor.id} />
      </div>

      <div className="mt-6 flex justify-end">
        <button className="text-[10px] font-black uppercase tracking-widest text-acid-lime hover:opacity-70 transition-opacity flex items-center gap-2 group">
          Security Audit
          <div className="w-4 h-4 rounded-full bg-acid-lime/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <Zap className="w-2 h-2" />
          </div>
        </button>
      </div>
    </div>
  )
}

function MetricBadge({ icon, label, value, status }: { icon: React.ReactNode, label: string, value: string, status: 'ok' | 'warning' | 'error' }) {
  const statusColors = {
    ok: 'text-acid-lime',
    warning: 'text-yellow-500',
    error: 'text-destructive'
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <div className={`flex items-center gap-1.5 font-bold text-xs ${statusColors[status]}`}>
        {icon}
        {value}
      </div>
    </div>
  )
}
