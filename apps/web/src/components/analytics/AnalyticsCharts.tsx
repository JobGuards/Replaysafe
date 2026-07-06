"use client";

import React from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Uptime Trend Chart ───────────────────────────────────────────────────────

interface DailySummary {
  date: string;
  uptimePercent: number | null;
  successCount: number;
  failureCount: number;
  lateCount: number;
  totalHeartbeats: number;
}

export function UptimeChart({ summaries }: { summaries: DailySummary[] }) {
  const data = summaries.map((s) => ({
    date: format(new Date(s.date), "MMM d"),
    uptime: s.uptimePercent != null ? Math.round(s.uptimePercent) : null,
    failures: s.failureCount,
    total: s.totalHeartbeats,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uptime Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: 12,
              }}
              formatter={(value: any) => [`${value}%`, "Uptime"]}
            />
            <Line
              type="monotone"
              dataKey="uptime"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Failure Distribution Chart ───────────────────────────────────────────────

export function FailureDistributionChart({
  summaries,
}: {
  summaries: DailySummary[];
}) {
  const data = summaries.map((s) => ({
    date: format(new Date(s.date), "MMM d"),
    success: s.successCount,
    failed: s.failureCount,
    late: s.lateCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Heartbeat Distribution (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="success"
              fill="hsl(142 71% 45%)"
              name="Success"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="failed"
              fill="hsl(0 84% 60%)"
              name="Failed"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="late"
              fill="hsl(38 92% 50%)"
              name="Late"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Health Score Gauge ───────────────────────────────────────────────────────

interface HealthScoreGaugeProps {
  score: number | null;
  monitorName: string;
}

export function HealthScoreGauge({
  score,
  monitorName,
}: HealthScoreGaugeProps) {
  const s = score ?? 0;
  const getColor = () => {
    if (s >= 90) return "text-emerald-500";
    if (s >= 75) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    if (s >= 40) return "text-orange-500";
    return "text-destructive";
  };
  const getLabel = () => {
    if (s >= 90)
      return {
        text: "Excellent",
        variant: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    if (s >= 75)
      return {
        text: "Good",
        variant: "bg-green-500/10 text-green-500 border-green-500/20",
      };
    if (s >= 60)
      return {
        text: "Fair",
        variant: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      };
    if (s >= 40)
      return {
        text: "Degraded",
        variant: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      };
    return {
      text: "Critical",
      variant: "bg-destructive/10 text-destructive border-destructive/20",
    };
  };

  const label = getLabel();
  const circumference = 2 * Math.PI * 40;
  const strokeDasharray = `${(s / 100) * circumference} ${circumference}`;

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col items-center gap-3">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={
              s >= 75
                ? "hsl(142 71% 45%)"
                : s >= 50
                  ? "hsl(38 92% 50%)"
                  : "hsl(0 84% 60%)"
            }
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="text-center -mt-2">
          <span className={`text-3xl font-bold ${getColor()}`}>{s}</span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>
        <Badge variant="outline" className={label.variant}>
          {label.text}
        </Badge>
        <p className="text-xs text-muted-foreground text-center">
          {monitorName}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Failure Patterns Panel ───────────────────────────────────────────────────

interface Pattern {
  id: string;
  type: string;
  description: string;
  confidence: number;
  occurrences: number;
}

const patternTypeLabels: Record<string, { label: string; color: string }> = {
  time_based: {
    label: "Time-Based",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  duration_anomaly: {
    label: "Duration Anomaly",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  streak: {
    label: "Failure Streak",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  degradation: {
    label: "Degradation Trend",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
};

export function FailurePatternsPanel({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detected Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No patterns detected — monitor looks healthy!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detected Patterns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {patterns.map((p) => {
          const meta = patternTypeLabels[p.type] ?? {
            label: p.type,
            color: "bg-muted text-muted-foreground",
          };
          return (
            <div key={p.id} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className={`text-xs ${meta.color}`}>
                  {meta.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(p.confidence * 100)}% confidence · {p.occurrences}
                  x
                </span>
              </div>
              <p className="text-sm">{p.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
