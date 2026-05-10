'use client'

import React from 'react'
import { Activity, Clock, MoreVertical, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HealthScoreBadge } from './HealthScoreBadge'
import { HeartbeatPulse } from './HeartbeatPulse'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MonitorCardProps {
  monitor: any
}

export function HeartbeatMonitorCard({ monitor }: MonitorCardProps) {
  return (
    <div className="glass-panel border border-border/10 rounded-3xl p-8 bg-card/5 hover:border-acid-lime/30 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${monitor.status === 'UP' ? 'bg-acid-lime/10 border-acid-lime/20 text-acid-lime' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <Link href={`/monitors/${monitor.id}`}>
              <h3 className="text-xl font-black uppercase tracking-tight italic group-hover:text-acid-lime transition-colors">{monitor.name}</h3>
            </Link>
            <div className="flex items-center gap-2 mt-1">
               <Clock className="w-3 h-3 text-muted-foreground" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{monitor.schedule}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HealthScoreBadge score={monitor.healthScore} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/10">
              <DropdownMenuItem asChild>
                <Link href={`/monitors/${monitor.id}`}>Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/monitors/${monitor.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Pause</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Last Heartbeat</span>
          <span className="text-foreground">
            {monitor.lastHeartbeatAt 
              ? formatDistanceToNow(new Date(monitor.lastHeartbeatAt), { addSuffix: true })
              : 'Never'}
          </span>
        </div>

        <div className="pt-6 border-t border-border/5">
           <HeartbeatPulse monitorId={monitor.id} />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className={`w-2 h-2 rounded-full animate-pulse ${monitor.status === 'UP' ? 'bg-acid-lime' : 'bg-destructive'}`} />
          {monitor.status}
        </div>
        <Link href={`/monitors/${monitor.id}`} className="text-[10px] font-black uppercase tracking-widest text-acid-lime hover:opacity-70 transition-opacity flex items-center gap-2 group">
          View Analytics
          <Zap className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
