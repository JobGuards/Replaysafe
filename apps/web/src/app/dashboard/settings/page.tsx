"use client";

import React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Loader2,
  Check,
  AlertCircle,
  Key,
  Plus,
  Trash2,
  Copy,
  ShieldCheck,
  Bell,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Sync state if user data loads later
  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("[v0] Updating profile:", { fullName, email });
      setSuccessMessage("Profile updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("[v0] Changing password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Password changed successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // API Keys Logic
  const { data: apiKeys, mutate: mutateKeys } = useSWR("/api-keys", () =>
    api.getApiKeys(),
  );
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setIsCreatingKey(true);
    try {
      const newKey = await api.createApiKey(newKeyName);
      toast.success("API Key created successfully");
      setNewKeyName("");
      mutateKeys();

      setGeneratedKey(newKey.key);
      navigator.clipboard.writeText(newKey.key);
      toast.info("API Key copied to clipboard! Keep it safe.");
    } catch (err) {
      toast.error("Failed to create API key");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? Systems using this key will lose access.",
      )
    )
      return;
    try {
      await api.deleteApiKey(id);
      toast.success("API Key revoked");
      mutateKeys();
    } catch (err) {
      toast.error("Failed to revoke API key");
    }
  };

  // Alert Channels Logic
  const { data: channels, mutate: mutateChannels } = useSWR(
    "/alert-channels",
    () => api.getAlertChannels(),
  );
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const handleAddDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordWebhookUrl) return;

    if (!discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      toast.error("Invalid Discord Webhook URL");
      return;
    }

    setIsAddingChannel(true);
    try {
      await api.createAlertChannel("DISCORD", {
        webhookUrl: discordWebhookUrl,
      });
      toast.success("Discord channel added successfully");
      setDiscordWebhookUrl("");
      mutateChannels();
    } catch (err) {
      toast.error("Failed to add alert channel");
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (
      !confirm(
        "Delete this alert channel? You will no longer receive notifications through it.",
      )
    )
      return;
    try {
      await api.deleteAlertChannel(id);
      toast.success("Alert channel removed");
      mutateChannels();
    } catch (err) {
      toast.error("Failed to remove alert channel");
    }
  };

  return (
    <div className="p-6 md:p-8">
      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center  justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel border border-border/10 rounded-2xl p-8  w-2xl mx-4 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-acid-lime to-transparent"></div>
            <h3 className="text-xl font-black text-foreground mb-4 uppercase tracking-tight">
              API Key Generated
            </h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Please copy this key now. For security reasons,{" "}
              <strong>we cannot show it to you again</strong>.
            </p>
            <div className="flex gap-2 items-center bg-background/50 border border-border/10 p-3 rounded-xl mb-6">
              <code className="text-xs font-mono select-all break-all text-acid-lime flex-1">
                {generatedKey}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="hover:text-acid-lime text-muted-foreground"
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  toast.success("Copied to clipboard!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="w-full bg-acid-lime text-primary-foreground hover:opacity-90 font-bold h-12 rounded-xl"
              onClick={() => setGeneratedKey(null)}
            >
              Done, I've saved it
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight">
            Profile Information
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
                >
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-acid-lime text-primary-foreground hover:opacity-90 h-12 px-8 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.2)] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight">
            Change Password
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
              >
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
                >
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-bold text-muted-foreground uppercase tracking-widest"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-acid-lime text-primary-foreground hover:opacity-90 h-12 px-8 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.2)] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </div>

        {/* API Keys Section */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl bg-card/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <Key className="w-5 h-5 text-acid-lime" /> API Keys
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Use these keys to authenticate with the Replaysafe CLI and
                ReplayGuard SDK.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateKey} className="flex gap-4 mb-10">
            <Input
              placeholder="Key Name (e.g., Production Server)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-background/30 border-border/10 h-12 rounded-xl"
            />
            <Button
              type="submit"
              disabled={isCreatingKey || !newKeyName}
              className="bg-acid-lime text-primary-foreground gap-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
            >
              {isCreatingKey ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Generate Key
            </Button>
          </form>

          <div className="space-y-4">
            {apiKeys && apiKeys.length > 0 ? (
              apiKeys.map((key: any) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-6 rounded-2xl bg-foreground/[0.02] border border-border/5 group hover:border-border/10 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10">
                      <ShieldCheck className="w-5 h-5 text-acid-lime/40" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">
                        {key.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          {key.key.substring(0, 8)}...
                          {key.key.substring(key.key.length - 4)}
                        </code>
                        <span className="text-[10px] text-muted-foreground/40 font-medium">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border/5 rounded-3xl">
                <p className="text-muted-foreground text-sm font-medium italic">
                  No active API keys found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Protocol Section */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl">
          <div className="mb-8">
            <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
              <Bell className="w-5 h-5 text-acid-lime" /> Notification Protocol
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Configure where Replaysafe sends alerts for failure and recovery
              events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Discord Form */}
            <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-border/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20">
                  <MessageSquare className="w-4 h-4 text-[#5865F2]" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  Add Discord Webhook
                </h3>
              </div>
              <form onSubmit={handleAddDiscord} className="space-y-4">
                <Input
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  className="bg-background/30 border-border/10 text-xs h-10 rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={isAddingChannel || !discordWebhookUrl}
                  className="w-full bg-foreground text-background h-10 rounded-xl font-black uppercase tracking-widest text-[9px] gap-2"
                >
                  {isAddingChannel ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Connect Discord
                </Button>
              </form>
            </div>

            {/* Other Channels Placeholder */}
            <div className="p-6 rounded-2xl border border-dashed border-border/10 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                More coming soon
              </p>
              <div className="flex gap-4 opacity-20 grayscale">
                <div className="w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">S</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">E</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
              Active Channels
            </h3>
            {channels && channels.length > 0 ? (
              channels.map((channel: any) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-6 rounded-2xl bg-foreground/[0.02] border border-border/5 group hover:border-border/10 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10">
                      {channel.type === "DISCORD" ? (
                        <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                      ) : (
                        <Bell className="w-5 h-5 text-acid-lime/40" />
                      )}
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">
                        {channel.type === "DISCORD"
                          ? "Discord Webhook"
                          : channel.type}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          {channel.config?.webhookUrl
                            ? `${channel.config.webhookUrl.substring(0, 30)}...`
                            : "••••••••••••••••"}
                        </code>
                        {channel.enabled ? (
                          <span className="text-[8px] font-black uppercase bg-acid-lime/10 text-acid-lime px-2 py-0.5 rounded-full border border-acid-lime/20">
                            Active
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border/5 rounded-3xl">
                <p className="text-muted-foreground text-sm font-medium italic">
                  No notification channels configured.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-destructive/5 border border-destructive rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Danger Zone
          </h2>
          <p className="text-muted-foreground mb-6">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>

          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
