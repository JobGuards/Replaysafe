"use client";

import React from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Plus, Lock, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MonitorList } from "@/components/MonitorList";
import { useAuth } from "@/contexts/AuthContext";

const fetcher = () => api.getMonitors();
const incidentsFetcher = () => api.getIncidents();

export default function DashboardPage() {
  const { activeOrganization } = useAuth();

  const { data: monitors } = useSWR(
    activeOrganization ? `/monitors?projectId=${activeOrganization.id}` : null,
    fetcher,
    { refreshInterval: 10000 },
  );

  const { data: incidents } = useSWR(
    activeOrganization ? `/incidents?projectId=${activeOrganization.id}` : null,
    incidentsFetcher,
    { refreshInterval: 15000 },
  );

  const totalMonitors = monitors?.length ?? 0;
  const tunnelMonitors =
    monitors?.filter((m: any) => m.type === "TUNNEL").length ?? 0;
  const openIncidents =
    (incidents as any[])?.filter((i: any) => !i.resolvedAt).length ?? 0;
  const securityRisks =
    monitors?.filter(
      (m: any) =>
        m.status === "DEGRADED" ||
        (m.type === "TUNNEL" && m.handshakeAge > 3600),
    ).length ?? 0;

  return (
    <div className="flex flex-col gap-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-foreground/[0.02] p-10 rounded-[3rem] border border-border/5">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic leading-none">
            Control <span className="text-acid-lime">Center</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-3 font-medium">
            Global infrastructure health and sentinel security status.
          </p>
        </div>
        <Link href="/dashboard/monitors/new">
          <Button
            size="lg"
            className="bg-acid-lime text-primary-foreground gap-3 px-10 h-16 rounded-2xl shadow-2xl shadow-acid-lime/20 hover:shadow-acid-lime/40 transition-all font-black uppercase tracking-widest text-sm group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />{" "}
            Deploy Monitor
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Sentinels"
          value={totalMonitors}
          icon={<Activity className="h-5 w-5" />}
          subtitle="Configured endpoints"
          color="muted"
        />

        <StatCard
          title="Secure Tunnels"
          value={tunnelMonitors}
          icon={<Lock className="h-5 w-5" />}
          color="acid-lime"
          subtitle="Encrypted connections"
        />

        <StatCard
          title="Security Risks"
          value={securityRisks}
          icon={<ShieldAlert className="h-5 w-5" />}
          color={securityRisks > 0 ? "destructive" : "muted"}
          subtitle={
            securityRisks > 0 ? "Risk patterns detected" : "Infrastructure safe"
          }
        />

        <StatCard
          title="Active Incidents"
          value={openIncidents}
          icon={<Zap className="h-5 w-5" />}
          color={openIncidents > 0 ? "orange" : "muted"}
          link={openIncidents > 0 ? "/incidents" : undefined}
          subtitle="Critical service errors"
        />
      </div>

      {/* Monitor List Section */}
      <section className="space-y-8 pt-4">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-2xl font-black uppercase tracking-tight italic">
            Infrastructure Pulse
          </h2>
          <div className="flex items-center gap-4 bg-foreground/[0.03] px-6 py-2 rounded-full border border-border/5">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
              Telemetry Active
            </span>
            <div className="w-2 h-2 rounded-full bg-acid-lime animate-pulse shadow-[0_0_12px_#d9ff00]" />
          </div>
        </div>
        <div className="glass-panel rounded-[3rem] overflow-hidden border border-border/10 shadow-2xl bg-card/10">
          <MonitorList />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
  color = "muted",
  progress,
  link,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
  progress?: number;
  link?: string;
}) {
  const colorClasses =
    {
      "acid-lime": "border-acid-lime/20 bg-acid-lime/[0.02] text-acid-lime",
      destructive:
        "border-destructive/20 bg-destructive/[0.02] text-destructive",
      orange: "border-orange-500/20 bg-orange-500/[0.02] text-orange-500",
      muted: "border-border/10 bg-foreground/[0.02] text-muted-foreground",
    }[color] || "border-border/10 bg-foreground/[0.02] text-muted-foreground";

  const content = (
    <Card
      className={`relative overflow-hidden glass-panel border border-border/10 rounded-[2.5rem] ${colorClasses} transition-all duration-500 hover:border-acid-lime/30 group hover:-translate-y-1`}
    >
      <CardHeader className="pb-4 pt-8 px-8 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
          {title}
        </CardTitle>
        <div className="opacity-40 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="text-5xl font-black tracking-tighter text-foreground">
          {value}
        </div>
        {progress !== undefined ? (
          <div className="flex items-center gap-4 mt-6">
            <div className="w-full h-2 bg-foreground/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-current transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black opacity-80">
              {Math.round(progress)}%
            </span>
          </div>
        ) : (
          <p className="text-[10px] font-black mt-4 opacity-50 uppercase tracking-widest leading-relaxed">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return link ? (
    <Link href={link} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
}
