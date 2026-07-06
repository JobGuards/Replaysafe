"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import { Activity, Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HeartbeatMonitorCard } from "./monitors/HeartbeatMonitorCard";
import { TunnelStatusCard } from "./monitors/TunnelStatusCard";

import { useAuth } from "@/contexts/AuthContext";

const fetcher = () => api.getMonitors();

export function MonitorList() {
  const { activeOrganization } = useAuth();

  const {
    data: monitors,
    error,
    isLoading,
  } = useSWR(
    activeOrganization ? `/monitors?projectId=${activeOrganization.id}` : null,
    fetcher,
    { refreshInterval: 10000 },
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-[3rem] bg-foreground/[0.03] animate-pulse border border-border/5"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[3rem] border border-destructive/20 bg-destructive/5 p-8 text-center backdrop-blur-xl">
        <h3 className="text-xl font-black uppercase italic text-destructive">
          Sync Interrupted
        </h3>
        <p className="text-sm text-destructive/70 mt-2 font-medium">
          Failed to establish connection with the intelligence node.
        </p>
      </div>
    );
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center rounded-[3.5rem] border-2 border-dashed border-border/10 bg-foreground/[0.01] p-12 text-center group hover:border-acid-lime/20 transition-all duration-700">
        <div className="w-24 h-24 rounded-[2.5rem] bg-foreground/[0.03] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform relative overflow-hidden">
          <div className="absolute inset-0 bg-acid-lime/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Activity className="h-10 w-10 text-muted-foreground opacity-20 relative z-10" />
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tighter italic">
          Infrastructure Offline
        </h3>
        <p className="mb-12 text-muted-foreground  mt-4 font-medium leading-relaxed">
          Your fleet is currently invisible. Deploy your first heartbeat
          sentinel or secure network tunnel to begin observability.
        </p>
        <Link href="/dashboard/monitors/new">
          <Button
            size="lg"
            className="rounded-2xl h-16 px-12 bg-acid-lime text-primary-foreground shadow-2xl shadow-acid-lime/20 hover:shadow-acid-lime/40 transition-all font-black uppercase tracking-widest text-xs"
          >
            <Plus className="w-4 h-4 mr-3" />
            Deploy First Sentinel
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-10">
      {monitors.map((monitor: any) =>
        monitor.type === "TUNNEL" ? (
          <TunnelStatusCard key={monitor.id} monitor={monitor} />
        ) : (
          <HeartbeatMonitorCard key={monitor.id} monitor={monitor} />
        ),
      )}
    </div>
  );
}
