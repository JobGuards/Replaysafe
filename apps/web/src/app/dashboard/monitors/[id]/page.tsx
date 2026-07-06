"use client";

import React from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Copy,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  History as HistoryIcon,
  BarChart2,
  Wifi,
  Zap,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  UptimeChart,
  FailureDistributionChart,
  HealthScoreGauge,
  FailurePatternsPanel,
} from "@/components/analytics/AnalyticsCharts";
import { IncidentTimeline } from "@/components/analytics/IncidentTimeline";

// Helper component for the History tab
function MonitorHistoryPanel({
  monitorId,
  monitorName,
}: {
  monitorId: string;
  monitorName: string;
}) {
  const { data: analytics } = useSWR(`/analytics/${monitorId}`, () =>
    api.getMonitorAnalytics(monitorId),
  );
  const { data: history, mutate: mutateHistory } = useSWR(
    `/analytics/${monitorId}/history`,
    () => api.getMonitorHistory(monitorId),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UptimeChart summaries={analytics?.summaries || []} />
        <FailureDistributionChart summaries={analytics?.summaries || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Incident History</CardTitle>
            </CardHeader>
            <CardContent>
              <IncidentTimeline
                incidents={history?.incidents || []}
                onResolved={() => mutateHistory()}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <FailurePatternsPanel patterns={analytics?.patterns || []} />
        </div>
      </div>
    </div>
  );
}

const fetcher = (id: string) => api.getMonitor(id);

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    data: monitorData,
    error,
    isLoading,
  } = useSWR(id ? `/monitors/${id}` : null, () => fetcher(id), {
    refreshInterval: 10000,
  });
  const monitor = monitorData as any;

  const copyHeartbeatUrl = () => {
    if (monitor) {
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040"}/hb/${monitor.heartbeatToken}`;
      navigator.clipboard.writeText(url);
      toast.success("Heartbeat URL copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (!monitor) return;
    if (
      !confirm(
        `Are you sure you want to delete "${monitor.name}"? This action cannot be undone.`,
      )
    )
      return;
    try {
      await api.deleteMonitor(monitor.id);
      toast.success("Monitor deleted");
      router.push("/dashboard/monitors");
    } catch {
      toast.error("Failed to delete monitor");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive opacity-50" />
        <p className="text-muted-foreground">
          Monitor not found or failed to load.
        </p>
        <Link href="/dashboard/monitors">
          <Button variant="outline">Back to Monitors</Button>
        </Link>
      </div>
    );
  }

  const heartbeatUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4040"}/hb/${monitor.heartbeatToken}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/monitors">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 gap-1 text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Monitors
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <StatusIcon status={monitor.status} />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {monitor.name}
              </h1>
              {monitor.description && (
                <p className="text-muted-foreground mt-1">
                  {monitor.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/dashboard/monitors/${monitor.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" /> Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs for Details vs History */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <HistoryIcon className="h-4 w-4" /> History & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Heartbeat URL */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Copy className="h-4 w-4 text-primary" /> Heartbeat URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ping this URL at the end of your job or cron script to
                    signal success.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-muted px-4 py-2.5 font-mono text-sm break-all">
                      {heartbeatUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyHeartbeatUrl}
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 rounded-md bg-muted/50 border p-4 font-mono text-xs text-muted-foreground relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="h-3 w-3 cursor-pointer" />
                    </div>
                    <p className="text-primary mb-1">
                      # Example usage in cron:
                    </p>
                    <p className="opacity-70">/path/to/script.sh && \</p>
                    <p>curl -fsS -m 10 --retry 5 {heartbeatUrl}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Details */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">
                    Monitor Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-semibold">{monitor.type}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Grace Period</dt>
                      <dd className="font-semibold">
                        {monitor.graceSeconds}s (
                        {Math.floor(monitor.graceSeconds / 60)} min)
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Timezone</dt>
                      <dd className="font-semibold">{monitor.timezone}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Notify After</dt>
                      <dd className="font-semibold">
                        {monitor.notifyAfterSeconds}s delay
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Tunnelight Telemetry */}
              {monitor.type === "TUNNEL" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatCard
                    title="Real-time Latency"
                    value={
                      monitor.lastHeartbeat?.latency != null
                        ? `${monitor.lastHeartbeat.latency}ms`
                        : "---"
                    }
                    subValue="Round-trip time via Sentinel CLI"
                    icon={<Wifi className="h-4 w-4 text-acid-lime" />}
                  />
                  <StatCard
                    title="Handshake Age"
                    value={
                      monitor.lastHeartbeat?.handshakeAge != null
                        ? `${Math.floor(monitor.lastHeartbeat.handshakeAge / 60)}m ${monitor.lastHeartbeat.handshakeAge % 60}s`
                        : "---"
                    }
                    subValue="Time since last cryptographic sync"
                    icon={<Zap className="h-4 w-4 text-acid-lime" />}
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Health Score Small Gauge */}
              {monitor.healthScore != null && (
                <HealthScoreGauge
                  score={monitor.healthScore}
                  monitorName={monitor.name}
                />
              )}

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Pings
                    </span>
                    <span className="text-sm font-bold">
                      {monitor.totalHeartbeats || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Consecutive Fails
                    </span>
                    <span
                      className={`text-sm font-bold ${monitor.consecutiveFailures > 0 ? "text-destructive" : "text-emerald-500"}`}
                    >
                      {monitor.consecutiveFailures || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-0">
          <MonitorHistoryPanel
            monitorId={monitor.id}
            monitorName={monitor.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "UP")
    return (
      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
    );
  if (status === "DOWN")
    return (
      <div className="w-3 h-3 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
    );
  return <div className="w-3 h-3 rounded-full bg-amber-500" />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "UP")
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
        Healthy
      </Badge>
    );
  if (status === "DOWN") return <Badge variant="destructive">Down</Badge>;
  if (status === "DEGRADED")
    return (
      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
        Degraded
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}

function StatCard({
  title,
  value,
  subValue,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  subValue?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="font-semibold text-lg leading-tight">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
