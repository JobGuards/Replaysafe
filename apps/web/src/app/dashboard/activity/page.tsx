"use client";

import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
} from "lucide-react";

interface ActivityEvent {
  id: string;
  monitorName: string;
  type: "success" | "failure" | "timeout" | "alert";
  message: string;
  timestamp: string;
  duration?: string;
  details?: string;
}

export default function Activity() {
  const { activeOrganization } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "success" | "failure" | "timeout" | "alert"
  >("all");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">(
    "week",
  );

  const projectId = activeOrganization?.id;

  const {
    data,
    error,
    isLoading: isSWRLoading,
  } = useSWR(
    projectId ? `/activity/${projectId}` : null,
    () => api.getActivity(),
    { refreshInterval: 10000 },
  );

  const isLoading = isSWRLoading || !projectId;

  const rawHeartbeats = data?.heartbeats || [];

  const activities: ActivityEvent[] = rawHeartbeats.map((hb: any) => ({
    id: hb.id,
    monitorName: hb.monitor?.name || "Unknown Monitor",
    type: hb.type === "SUCCESS" ? "success" : "failure",
    message:
      hb.type === "SUCCESS"
        ? "Heartbeat received successfully"
        : hb.output || "Script failed",
    timestamp: formatDistanceToNow(new Date(hb.receivedAt), {
      addSuffix: true,
    }),
    duration: hb.duration ? `${(hb.duration / 1000).toFixed(2)}s` : undefined,
    details: hb.output && hb.type === "FAILURE" ? hb.output : undefined,
  }));

  const filteredActivities = activities.filter((activity) => {
    if (selectedFilter === "all") return true;
    return activity.type === selectedFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        };
      case "failure":
        return {
          icon: AlertCircle,
          color: "text-destructive",
          bg: "bg-destructive/10",
        };
      case "timeout":
        return {
          icon: Clock,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
        };
      case "alert":
        return {
          icon: AlertCircle,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-foreground",
          bg: "bg-secondary",
        };
    }
  };

  const typeColors: any = {
    success: {
      label: "Success",
      color: "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30",
    },
    failure: {
      label: "Failure",
      color: "bg-destructive/20 text-destructive border border-destructive/30",
    },
    timeout: {
      label: "Timeout",
      color: "bg-orange-500/20 text-orange-500 border border-orange-500/30",
    },
    alert: {
      label: "Alert",
      color: "bg-amber-500/20 text-amber-500 border border-amber-500/30",
    },
  };

  const handleExport = () => {
    if (filteredActivities.length === 0) return;

    const headers = ["Monitor", "Status", "Message", "Timestamp", "Duration"];
    const csvRows = [
      headers.join(","),
      ...filteredActivities.map((a) =>
        [
          `"${a.monitorName}"`,
          `"${a.type.toUpperCase()}"`,
          `"${a.message.replace(/"/g, '""')}"`,
          `"${a.timestamp}"`,
          `"${a.duration || "-"}"`,
        ].join(","),
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Replaysafe-activity-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Liveness Logs</h1>
          <p className="text-muted-foreground">View real-time check-in history of all running agent processes.</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExport}
          disabled={filteredActivities.length === 0}
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters (Simplified for now) */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        {(["all", "success", "failure"] as const).map((type) => (
          <Button
            key={type}
            variant={selectedFilter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(type as any)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 w-full bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No activity found</h3>
            <p className="text-sm text-muted-foreground">
              Waiting for the first heartbeat...
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredActivities.map((activity) => {
              const typeConfig = getTypeIcon(activity.type);
              const TypeIcon = typeConfig.icon;
              const typeLabel = typeColors[activity.type];

              return (
                <div
                  key={activity.id}
                  className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.bg}`}
                  >
                    <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {activity.monitorName}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {activity.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${typeLabel.color}`}
                        >
                          {typeLabel.label}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>

                    {activity.duration && (
                      <div className="mt-2 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Execution Time:{" "}
                          <span className="font-medium text-foreground">
                            {activity.duration}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
