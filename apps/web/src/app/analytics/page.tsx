"use client";

import React, { useState } from "react";
import useSWR from "swr";

import { api } from "@/lib/api";
import {
  UptimeChart,
  FailureDistributionChart,
  HealthScoreGauge,
  FailurePatternsPanel,
} from "@/components/analytics/AnalyticsCharts";
import { IncidentTimeline } from "@/components/analytics/IncidentTimeline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const monitorsFetcher = () => api.getMonitors();
const analyticsFetcher = (monitorId: string) =>
  fetch(`${API_BASE}/api/analytics/${monitorId}`, {
    credentials: "include",
  }).then((r) => r.json());
const historyFetcher = (monitorId: string) =>
  fetch(`${API_BASE}/api/analytics/${monitorId}/history`, {
    credentials: "include",
  }).then((r) => r.json());

export default function AnalyticsPage() {
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>("");

  const { data: monitors } = useSWR("/monitors", monitorsFetcher);
  const { data: analyticsData, mutate: mutateAnalytics } = useSWR(
    selectedMonitorId ? `/analytics/${selectedMonitorId}` : null,
    () => analyticsFetcher(selectedMonitorId),
    { refreshInterval: 30000 },
  );
  const { data: historyData, mutate: mutateHistory } = useSWR(
    selectedMonitorId ? `/analytics/${selectedMonitorId}/history` : null,
    () => historyFetcher(selectedMonitorId),
    { refreshInterval: 30000 },
  );

  const onResolved = () => {
    mutateHistory();
    mutateAnalytics();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep-dive into monitor performance, patterns, and history.
          </p>
        </div>

        {/* Monitor Selector */}
        <Select value={selectedMonitorId} onValueChange={setSelectedMonitorId}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select a monitor..." />
          </SelectTrigger>
          <SelectContent>
            {((monitors as any[]) || []).map((m: any) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedMonitorId && (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <Activity className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
          <p className="font-medium">Select a monitor to view analytics</p>
          <p className="text-sm text-muted-foreground">
            Choose a monitor from the dropdown above
          </p>
        </div>
      )}

      {selectedMonitorId && analyticsData && (
        <Tabs defaultValue="charts">
          <TabsList>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="history">Incident History</TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <UptimeChart summaries={analyticsData.summaries ?? []} />
                <FailureDistributionChart
                  summaries={analyticsData.summaries ?? []}
                />
              </div>
              <div className="space-y-4">
                <HealthScoreGauge
                  score={analyticsData.healthScore ?? null}
                  monitorName={analyticsData.monitorName ?? ""}
                />
                {/* Stats summary */}
                {analyticsData.summaries?.length > 0 && (
                  <QuickStats summaries={analyticsData.summaries} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="mt-4">
            <FailurePatternsPanel patterns={analyticsData.patterns ?? []} />
          </TabsContent>

          {/* History Tab (PR #42: Execution Memory) */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Incident History</CardTitle>
              </CardHeader>
              <CardContent>
                <IncidentTimeline
                  incidents={historyData?.incidents ?? []}
                  onResolved={onResolved}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function QuickStats({ summaries }: { summaries: any[] }) {
  const total = summaries.reduce(
    (s: number, d: any) => s + (d.totalHeartbeats || 0),
    0,
  );
  const failures = summaries.reduce(
    (s: number, d: any) => s + (d.failureCount || 0),
    0,
  );
  const avgUptime = summaries
    .filter((d: any) => d.uptimePercent != null)
    .reduce(
      (sum: number, d: any, _: number, arr: any[]) =>
        sum + d.uptimePercent / arr.length,
      0,
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">30-Day Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Heartbeats</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Failures</span>
          <span className="font-medium text-destructive">{failures}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Uptime</span>
          <span className="font-medium">{Math.round(avgUptime)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
