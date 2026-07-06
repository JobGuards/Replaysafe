"use client";

import React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import {
  Menu,
  X,
  LogOut,
  Settings,
  Home,
  BarChart3,
  Clock,
  Loader2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Globe,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, activeOrganization, isLoading, signout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // 🛡️ Authentication Guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin");
    }
  }, [user, isLoading, router]);

  const isCloud = process.env.NEXT_PUBLIC_REPLAYSAFE_CLOUD === "true";
  const isPro = activeOrganization?.plan === "PRO" && isCloud;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background bg-tech-grid">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-acid-lime/20 border-t-acid-lime rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-6 h-6 text-acid-lime animate-pulse" />
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-acid-lime italic animate-pulse">
          Synchronizing_Sentinel_Memory...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-background bg-tech-grid overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="radial-glow-hero opacity-30 pointer-events-none"></div>

      {/* Top Navigation */}
      <header className="glass-panel h-16 shrink-0 z-50 border-b border-border/10 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-secondary/50 rounded-lg transition text-foreground"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProjectSwitcher />
            <div className="h-6 w-[1px] bg-border/10 mx-2" />
            <button
              onClick={signout}
              className="p-2 hover:bg-secondary/50 rounded-lg transition text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-[1600px] mx-auto w-full relative z-10">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 w-64 border-r border-border/10 bg-background/50 backdrop-blur-md transition-transform z-40 overflow-y-auto shrink-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="p-8 space-y-6">
            <SidebarLink href="/dashboard" icon={<Home className="w-4 h-4" />} label="Dashboard" active={pathname === '/dashboard'} />
            <SidebarLink href="/dashboard/monitors" icon={<Activity className="w-4 h-4" />} label="Agents" active={pathname?.startsWith('/dashboard/monitors')} />
            <SidebarLink href="/dashboard/activity" icon={<Clock className="w-4 h-4" />} label="Liveness Logs" active={pathname === '/dashboard/activity'} />
            <SidebarLink href="/dashboard/incidents" icon={<AlertTriangle className="w-4 h-4" />} label="Crashes" active={pathname === '/dashboard/incidents'} />
            <SidebarLink href="/dashboard/guards" icon={<ShieldCheck className="w-4 h-4" />} label="Execution Ledger" active={pathname === '/dashboard/guards'} />
            <SidebarLink href="/dashboard/webhooks" icon={<Globe className="w-4 h-4" />} label="Escalations" active={pathname === '/dashboard/webhooks'} />
            <SidebarLink href="/dashboard/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={pathname === '/dashboard/analytics'} />
            <div className="border-t border-border/5 my-8" />
            <SidebarLink
              href="/dashboard/settings"
              icon={<Settings className="w-4 h-4" />}
              label="Settings"
              active={pathname?.startsWith("/dashboard/settings")}
            />
          </nav>

          <div className="mt-auto p-4 mx-8 mb-8 glass-panel border-acid-lime/10 rounded-2xl space-y-3">
            <div className="flex flex-col gap-2 justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                Sovereign_Deployment
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  isPro
                    ? "bg-acid-lime text-[#0f1a14]"
                    : "bg-acid-lime/20 text-acid-lime border border-acid-lime/30"
                }`}
              >
                {isPro ? "CLOUD_PRO" : "OPEN_SOURCE"}
              </span>
            </div>
            {!isPro && (
              <Link
                href="/pricing"
                className="block w-full py-2 bg-foreground text-background rounded-xl text-center text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Support Replaysafe
              </Link>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
        active
          ? "bg-acid-lime/10 text-acid-lime font-semibold border border-acid-lime/20 shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.05)]"
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      <span
        className={`${active ? "text-acid-lime" : "group-hover:text-acid-lime"} transition-colors`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
