"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface Incident {
  id: string;
  type: string;
  startedAt: string;
  resolvedAt: string | null;
  autoResolved: boolean;
  resolutionNotes: string | null;
  resolutionCategory: string | null;
  group?: { id: string; title: string; patternType: string } | null;
}

const RESOLUTION_CATEGORIES = [
  { value: "disk_space", label: "Disk Space" },
  { value: "permissions", label: "Permissions" },
  { value: "network", label: "Network" },
  { value: "credentials", label: "Credentials" },
  { value: "code_bug", label: "Code Bug" },
  { value: "config", label: "Configuration" },
  { value: "other", label: "Other" },
];

// ─── Incident Timeline ────────────────────────────────────────────────────────
export function IncidentTimeline({
  incidents,
  onResolved,
}: {
  incidents: Incident[];
  onResolved?: () => void;
}) {
  if (incidents.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <CheckCircle className="mb-3 h-10 w-10 text-emerald-500 opacity-40" />
        <p className="font-medium">No incidents yet</p>
        <p className="text-sm text-muted-foreground">
          This monitor has been running cleanly.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.id}
          incident={incident}
          onResolved={onResolved}
        />
      ))}
    </div>
  );
}

function IncidentCard({
  incident,
  onResolved,
}: {
  incident: Incident;
  onResolved?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(incident.resolutionNotes ?? "");
  const [category, setCategory] = useState(incident.resolutionCategory ?? "");
  const [saving, setSaving] = useState(false);

  const isOpen = !incident.resolvedAt;
  const duration = incident.resolvedAt
    ? Math.round(
        (new Date(incident.resolvedAt).getTime() -
          new Date(incident.startedAt).getTime()) /
          1000 /
          60,
      )
    : null;

  const saveResolution = async () => {
    setSaving(true);
    try {
      await api.resolveIncident(incident.id, {
        resolutionNotes: notes,
        resolutionCategory: category,
      });
      toast.success("Resolution notes saved");
      onResolved?.();
    } catch {
      toast.error("Failed to save resolution notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-background ${isOpen ? "bg-destructive" : "bg-emerald-500"}`}
      />

      <div
        className={`rounded-lg border p-3 ${isOpen ? "border-destructive/30 bg-destructive/5" : ""}`}
      >
        <div
          className="flex items-start justify-between gap-2 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isOpen ? (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm capitalize">
                  {incident.type} incident
                </span>
                {incident.group && (
                  <Badge variant="outline" className="text-xs">
                    {incident.group.title}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(incident.startedAt), "MMM d, yyyy HH:mm")}
                {duration != null && ` · ${duration}m duration`}
                {incident.autoResolved && " · auto-resolved"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOpen ? (
              <Badge variant="destructive" className="text-xs">
                Open
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              >
                Resolved
              </Badge>
            )}
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Resolution Notes (PR #44) */}
        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {incident.resolutionCategory && (
              <p className="text-xs text-muted-foreground">
                Cause:{" "}
                <span className="font-medium capitalize">
                  {incident.resolutionCategory.replace("_", " ")}
                </span>
              </p>
            )}
            {incident.resolutionNotes && !expanded && (
              <p className="text-sm">{incident.resolutionNotes}</p>
            )}
            <div className="space-y-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Categorize the cause..." />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTION_CATEGORIES.map((cat) => (
                    <SelectItem
                      key={cat.value}
                      value={cat.value}
                      className="text-xs"
                    >
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="What caused this? What fixed it? (e.g. 'Disk was full - ran cleanup script')"
                className="text-sm min-h-[70px] resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button size="sm" onClick={saveResolution} disabled={saving}>
                {saving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
