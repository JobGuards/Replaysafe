"use client";

import React from "react";
import { Shield, Zap, Activity, Clock, Key, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HealthScoreBadge } from "./HealthScoreBadge";
import { HeartbeatPulse } from "./HeartbeatPulse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TunnelStatusCardProps {
  monitor: {
    id: string;
    name: string;
    status: "UP" | "DOWN" | "DEGRADED" | "PAUSED";
    healthScore: number;
    config?: any;
    lastHeartbeat?: {
      latency?: number;
      handshakeAge?: number;
      receivedAt: string;
    };
  };
}

export function TunnelStatusCard({ monitor }: TunnelStatusCardProps) {
  const isStale =
    monitor.lastHeartbeat?.handshakeAge &&
    monitor.lastHeartbeat.handshakeAge > 300;
  const isSlow =
    monitor.lastHeartbeat?.latency && monitor.lastHeartbeat.latency > 1000;

  return (
    <div className="glass-panel border border-border/10 rounded-[2.5rem] p-10 bg-card/5 hover:border-acid-lime/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
        <Shield className="w-24 h-24 text-acid-lime" />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-8 relative z-10">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${monitor.status === "UP" ? "bg-acid-lime/10 border-acid-lime/20 text-acid-lime shadow-acid-lime/5" : "bg-destructive/10 border-destructive/20 text-destructive shadow-destructive/5"}`}
            >
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <Link href={`/dashboard/monitors/${monitor.id}`}>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-acid-lime transition-colors">
                  {monitor.name}
                </h3>
              </Link>
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-2 italic">
                Secure Tunnel (WireGuard)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <MetricBadge
              icon={<Activity className="w-3 h-3" />}
              label="Latency"
              value={
                monitor.lastHeartbeat?.latency
                  ? `${monitor.lastHeartbeat.latency}ms`
                  : "N/A"
              }
              status={isSlow ? "warning" : "ok"}
            />
            <MetricBadge
              icon={<Clock className="w-3 h-3" />}
              label="Handshake"
              value={
                monitor.lastHeartbeat?.handshakeAge
                  ? `${Math.floor(monitor.lastHeartbeat.handshakeAge / 60)}m ago`
                  : "N/A"
              }
              status={isStale ? "error" : "ok"}
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
          <div className="flex items-center gap-2">
            <HealthScoreBadge score={monitor.healthScore} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-8 w-8"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="rounded-xl border-border/10"
              >
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/monitors/${monitor.id}`}>
                    Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/monitors/${monitor.id}/edit`}>
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Pause
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${monitor.status === "UP" ? "bg-acid-lime" : "bg-destructive"}`}
            />
            {monitor.status}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-border/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Network Pulse (24h)
          </span>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-acid-lime" />
            <span className="text-[10px] font-bold text-acid-lime uppercase tracking-widest">
              Real-time
            </span>
          </div>
        </div>
        <HeartbeatPulse monitorId={monitor.id} />
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          href={`/dashboard/monitors/${monitor.id}`}
          className="text-[10px] font-black uppercase tracking-widest text-acid-lime hover:opacity-70 transition-opacity flex items-center gap-2 group"
        >
          View Analytics
          <div className="w-4 h-4 rounded-full bg-acid-lime/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <Zap className="w-2 h-2" />
          </div>
        </Link>
      </div>
    </div>
  );
}

function MetricBadge({
  icon,
  label,
  value,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "ok" | "warning" | "error";
}) {
  const statusColors = {
    ok: "text-acid-lime",
    warning: "text-yellow-500",
    error: "text-destructive",
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <div
        className={`flex items-center gap-1.5 font-bold text-xs ${statusColors[status]}`}
      >
        {icon}
        {value}
      </div>
    </div>
  );
}
