"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Globe,
  Search,
  Activity,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function WebhookHub() {
  const { activeOrganization } = useAuth();
  const { data: webhooks, isLoading } = useSWR(
    activeOrganization
      ? ["/api/guards/side-effects?type=WEBHOOK", activeOrganization.id]
      : null,
    () => api.getProjectSideEffects({ type: "WEBHOOK" }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Activity className="w-8 h-8 text-acid-lime animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
            Webhook Hub
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Global visibility for outbound communication and idempotency
          </p>
        </div>
      </div>

      {/* Webhook Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel border border-border/10 rounded-2xl p-6 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Total Requests
          </span>
          <span className="text-2xl font-black text-foreground">
            {webhooks?.length || 0}
          </span>
        </div>
        <div className="glass-panel border border-border/10 rounded-2xl p-6 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Delivered
          </span>
          <span className="text-2xl font-black text-acid-lime">
            {webhooks?.filter((h: any) => h.status === "COMPLETED").length || 0}
          </span>
        </div>
        <div className="glass-panel border border-border/10 rounded-2xl p-6 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Deduplicated
          </span>
          <span className="text-2xl font-black text-amber-500">
            {webhooks?.filter((h: any) => h.status === "SKIPPED").length || 0}
          </span>
        </div>
        <div className="glass-panel border border-border/10 rounded-2xl p-6 flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Safety Rate
          </span>
          <span className="text-2xl font-black text-blue-400">
            {webhooks && webhooks.length > 0
              ? Math.round(
                  (webhooks.filter((h: any) => h.status === "SKIPPED").length /
                    webhooks.length) *
                    100,
                )
              : 0}
            %
          </span>
        </div>
      </div>

      <div className="glass-panel border border-border/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border/10">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Target
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Execution
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Occurred
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {webhooks?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-20 text-center text-muted-foreground italic"
                  >
                    No webhooks tracked yet.
                  </td>
                </tr>
              ) : (
                webhooks?.map((hook: any) => (
                  <tr
                    key={hook.id}
                    className="hover:bg-foreground/[0.01] transition-colors group"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-foreground text-sm truncate max-w-[200px]">
                          {hook.target}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                          hook.status === "COMPLETED"
                            ? "bg-acid-lime/10 border-acid-lime/20 text-acid-lime"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        }`}
                      >
                        {hook.status === "COMPLETED"
                          ? "Delivered"
                          : "Deduplicated"}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                          {hook.execution.monitor.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/40">
                          Attempt {hook.execution.attempt}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-xs text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(hook.executedAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-6">
                      <Link
                        href={`/dashboard/guards/${hook.executionId}`}
                        className="text-acid-lime hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                      >
                        Inspect Trace
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
