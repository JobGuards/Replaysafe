'use client'

import React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'

interface PulseData {
  status: 'success' | 'error' | 'pending'
  receivedAt: string
  latencyMs?: number
}

export function HeartbeatPulse({ pulses }: { pulses: PulseData[] }) {
  // Fill with dummy data if less than 288 (full day at 5m)
  const fullPulses = [...pulses]
  while (fullPulses.length < 288) {
    fullPulses.push({ status: 'pending', receivedAt: new Date(0).toISOString() })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">24h Heartbeat Pulse</h3>
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-acid-lime" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Down</span>
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={100}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8px,1fr))] gap-1">
          {fullPulses.reverse().map((pulse, i) => (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-[2px] transition-all hover:scale-150 cursor-crosshair ${
                    pulse.status === 'success'
                      ? 'bg-acid-lime shadow-[0_0_5px_rgba(var(--theme-lime-rgb),0.3)]'
                      : pulse.status === 'error'
                      ? 'bg-destructive'
                      : 'bg-foreground/5'
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-card/90 backdrop-blur border-border/10 p-3 rounded-xl shadow-2xl">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {pulse.status === 'pending' ? 'No Data' : format(new Date(pulse.receivedAt), 'MMM d, HH:mm:ss')}
                  </p>
                  <p className={`font-black text-sm uppercase ${
                    pulse.status === 'success' ? 'text-acid-lime' : 'text-destructive'
                  }`}>
                    {pulse.status === 'success' ? 'Operational' : pulse.status === 'error' ? 'Incident Detected' : 'Offline'}
                  </p>
                  {pulse.latencyMs && (
                    <p className="text-xs font-bold text-foreground/70">
                      Latency: <span className="text-foreground">{pulse.latencyMs}ms</span>
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  )
}
