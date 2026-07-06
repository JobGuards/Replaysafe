"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Mail, Webhook, Plus, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [emailAddress, setEmailAddress] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [alertChannels, setAlertChannels] = useState<
    { id: string; type: string; config: string; enabled: boolean }[]
  >([]);

  const addEmailChannel = () => {
    if (!emailAddress) return;
    setAlertChannels([
      ...alertChannels,
      {
        id: Date.now().toString(),
        type: "email",
        config: emailAddress,
        enabled: true,
      },
    ]);
    setEmailAddress("");
    toast.success("Email alert channel added");
  };

  const addWebhookChannel = () => {
    if (!webhookUrl) return;
    setAlertChannels([
      ...alertChannels,
      {
        id: Date.now().toString(),
        type: "webhook",
        config: webhookUrl,
        enabled: true,
      },
    ]);
    setWebhookUrl("");
    toast.success("Webhook alert channel added");
  };

  const removeChannel = (id: string) => {
    setAlertChannels(alertChannels.filter((c) => c.id !== id));
    toast.success("Alert channel removed");
  };

  const toggleChannel = (id: string) => {
    setAlertChannels(
      alertChannels.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your project, notifications, and integrations.
        </p>
      </div>

      {/* Alert Channels Section */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Channels</CardTitle>
          <CardDescription>
            Configure where you receive notifications when a monitor fails or
            recovers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Email Alerts</h3>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="alerts@yourcompany.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEmailChannel()}
              />
              <Button
                onClick={addEmailChannel}
                variant="outline"
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Webhook */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Webhook Alerts</h3>
            </div>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://hooks.slack.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addWebhookChannel()}
              />
              <Button
                onClick={addWebhookChannel}
                variant="outline"
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>

          {/* Channel List */}
          {alertChannels.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Configured Channels
                </h3>
                {alertChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between rounded-lg border p-3 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {channel.type === "email" ? (
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {channel.config}
                      </span>
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {channel.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            Manage API keys for programmatically interacting with Replaysafe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground">
              API key management coming soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/40 p-4">
            <div>
              <p className="font-medium text-sm">Delete Project</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete this project and all monitors.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
