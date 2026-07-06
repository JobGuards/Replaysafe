"use client";

import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Shield, ShieldAlert, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { MonitorList } from "@/components/MonitorList";

const fetcher = () => api.getMonitors();

export default function MonitorsPage() {
  const { data: monitors } = useSWR("/monitors", fetcher, {
    refreshInterval: 10000,
  });

  const total = monitors?.length ?? 0;
  const up = monitors?.filter((m: any) => m.status === "UP").length ?? 0;
  const down = monitors?.filter((m: any) => m.status === "DOWN").length ?? 0;
  const degraded =
    monitors?.filter((m: any) => m.status === "DEGRADED").length ?? 0;

  return (
    <div className="max-w-[1600px] mx-auto w-full px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Premium Header */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Globe className="w-32 h-32 text-acid-lime" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-12 relative z-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Agent <span className="text-acid-lime">Profiles</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Track liveness, health status, and execution budgets of background agent daemons.
              Proactive loop protection and rollback sentinel metrics.
            </p>
          </div>

          <Link href="/dashboard/monitors/new">
            <Button size="lg" className="bg-acid-lime text-primary-foreground gap-4 px-12 h-16 rounded-2xl shadow-2xl shadow-acid-lime/20 hover:shadow-acid-lime/40 transition-all font-black uppercase tracking-widest text-sm group">
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" /> Register Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <QuickStat
          label="Active Fleet"
          value={total}
          icon={<Activity className="w-4 h-4" />}
        />
        <QuickStat
          label="Status: Up"
          value={up}
          icon={<Shield className="w-4 h-4" />}
          color="text-acid-lime"
        />
        <QuickStat
          label="Status: Down"
          value={down}
          icon={<ShieldAlert className="w-4 h-4" />}
          color="text-destructive"
        />
        <QuickStat
          label="Degraded"
          value={degraded}
          icon={<Zap className="w-4 h-4" />}
          color="text-orange-500"
        />
      </div>

      <div className="pt-4">
        <MonitorList />
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-8 rounded-3xl bg-foreground/[0.02] border border-border/5 group hover:bg-foreground/[0.04] transition-all hover:shadow-2xl hover:shadow-acid-lime/5">
      <div className="flex items-center gap-3">
        <div
          className={`${color} opacity-40 group-hover:opacity-100 transition-opacity`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic group-hover:text-muted-foreground/60 transition-colors">
          {label}
        </span>
      </div>
      <div className="text-4xl font-black tracking-tighter text-foreground leading-none">
        {value}
      </div>
    </div>
  );
}
