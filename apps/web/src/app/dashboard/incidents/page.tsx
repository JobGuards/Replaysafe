"use client";

import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ShieldAlert,
  ChevronRight,
  Timer,
  Zap,
  History,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

const fetcher = () => api.getIncidents();

export default function IncidentsPage() {
  const {
    data: incidents,
    error,
    isLoading,
  } = useSWR("/incidents", fetcher, {
    refreshInterval: 15000,
  });

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
      {/* ⚡ Premium Header Section */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldAlert className="w-48 h-48 text-acid-lime" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime italic">
            <Zap className="w-3 h-3 fill-acid-lime" />
            Agent_Control_Protocol_v2.0
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
            Failure <span className="text-acid-lime">Logs</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
            Real-time telemetry of agent execution errors. Every process crash,
            infinite retry loop, and failed side-effect rollback logged for deep
            analysis.
          </p>
        </div>
      </div>

      {/* 📊 Status Overview Bar */}
      {!isLoading && incidents && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatusStat
            label="Total Events"
            value={incidents.length}
            icon={<History className="w-4 h-4 text-muted-foreground" />}
          />
          <StatusStat
            label="Unresolved"
            value={incidents.filter((i: any) => !i.resolvedAt).length}
            icon={<AlertTriangle className="w-4 h-4 text-destructive" />}
            isDestructive={
              incidents.filter((i: any) => !i.resolvedAt).length > 0
            }
          />
          <StatusStat
            label="System Health"
            value="99.98%"
            icon={<Activity className="w-4 h-4 text-acid-lime" />}
          />
        </div>
      )}

      {/* 🛠️ Main Content */}
      <div className="flex flex-col gap-4 relative">
        {/* Timeline Path Line */}
        {!isLoading && incidents && incidents.length > 0 && (
          <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-border/20 via-border/10 to-transparent hidden md:block" />
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-[2rem] bg-foreground/[0.02] border border-border/5 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-destructive gap-4 glass-panel rounded-[2rem] border-destructive/10">
            <AlertTriangle className="w-12 h-12" />
            <p className="font-black uppercase tracking-widest text-xs">
              Failed_to_Synchronize_Vault
            </p>
          </div>
        ) : !incidents || incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] border border-dashed border-border/10 bg-foreground/[0.01] text-center px-12">
            <div className="w-24 h-24 rounded-full bg-acid-lime/5 flex items-center justify-center mb-8 border border-acid-lime/10 shadow-[0_0_50px_rgba(var(--theme-lime-rgb),0.1)]">
              <CheckCircle className="h-10 w-10 text-acid-lime" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic mb-4">
              Zero Deviations Detected
            </h3>
            <p className="text-muted-foreground font-medium">
              All infrastructure sentinels are reporting optimal status. No
              incidents recorded in this cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {incidents.map((incident: any, index: number) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusStat({ label, value, icon, isDestructive = false }: any) {
  return (
    <div
      className={`p-8 rounded-[2rem] border border-border/5 bg-foreground/[0.01] flex flex-col gap-3 group hover:border-border/10 transition-all ${isDestructive ? "hover:bg-destructive/[0.02]" : "hover:bg-acid-lime/[0.02]"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div
        className={`text-4xl font-black italic tracking-tighter transition-colors ${isDestructive ? "text-destructive group-hover:text-destructive" : "text-foreground group-hover:text-acid-lime"}`}
      >
        {value}
      </div>
    </div>
  );
}

function IncidentCard({ incident, index }: any) {
  const isResolved = !!incident.resolvedAt;

  return (
    <div
      className={`relative flex items-start gap-10 group transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 fill-mode-both`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Timeline Node */}
      <div className="hidden md:flex mt-12 w-16 h-16 rounded-full items-center justify-center shrink-0 z-10 relative">
        <div
          className={`absolute inset-0 rounded-full border-2 border-background transition-all duration-500 ${isResolved ? "bg-emerald-500/10" : "bg-destructive/10 animate-pulse"}`}
        />
        <div
          className={`w-3 h-3 rounded-full shadow-lg ${isResolved ? "bg-emerald-500" : "bg-destructive animate-ping"}`}
        />
      </div>

      {/* Card Content */}
      <div
        className={`flex-1 glass-panel p-8 md:p-10 rounded-[2.5rem] border border-border/5 hover:border-border/10 transition-all shadow-2xl hover:shadow-acid-lime/5 group/card`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <IncidentTypeBadge type={incident.type} />
              <div className="h-[1px] w-6 bg-border/20" />
              <span className="text-[10px] font-mono text-muted-foreground/60">
                {incident.id.slice(0, 8)}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground group-hover/card:text-acid-lime transition-colors">
                {incident.monitor?.name || "System Sentinel"}
              </h3>
              <p className="text-xs text-muted-foreground/80 font-medium tracking-wide flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {format(new Date(incident.startedAt), "PPp")}
                <span className="text-muted-foreground/30">•</span>
                {formatDistanceToNow(new Date(incident.startedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div
                className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isResolved ? "text-emerald-500" : "text-destructive"}`}
              >
                {isResolved ? "Duration" : "Ongoing_Downtime"}
              </div>
              <div
                className={`text-2xl font-black italic tracking-tighter flex items-center gap-2 justify-end`}
              >
                <Timer className="w-4 h-4 opacity-30" />
                {isResolved ? (
                  `${Math.floor((new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()) / 60000)}m`
                ) : (
                  <span className="animate-pulse">Active</span>
                )}
              </div>
            </div>

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isResolved ? "bg-emerald-500/5 text-emerald-500" : "bg-destructive/5 text-destructive"}`}
            >
              <ChevronRight className="w-5 h-5 group-hover/card:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentTypeBadge({ type }: { type: string }) {
  const configs: any = {
    missed: { icon: Clock, label: "Missed Heartbeat", color: "orange" },
    failed: { icon: AlertTriangle, label: "System Failure", color: "rose" },
    late: { icon: Clock, label: "Latency Breach", color: "amber" },
  };

  const config = configs[type] || {
    icon: ShieldAlert,
    label: type,
    color: "blue",
  };
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-foreground/[0.03] border border-border/5`}
    >
      <Icon className={`w-3 h-3 text-${config.color}-500`} />
      <span className="text-foreground/80">{config.label}</span>
    </div>
  );
}
