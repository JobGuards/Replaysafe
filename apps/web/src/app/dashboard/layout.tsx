'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Logo } from "@/components/Logo"
import { Menu, X, LogOut, Settings, Home, BarChart3, Clock, Loader2, ShieldCheck, Activity } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="h-screen flex flex-col bg-background bg-tech-grid overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="radial-glow-hero opacity-30 pointer-events-none"></div>

      {/* Top Navigation */}
      <header className="glass-panel h-16 shrink-0 z-50 border-b border-border/10 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary/50 rounded-lg transition text-foreground"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <button className="p-2 hover:bg-secondary/50 rounded-lg transition text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
            <button
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
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-8 space-y-6">
            <SidebarLink href="/dashboard" icon={<Home className="w-4 h-4" />} label="Dashboard" active={pathname === '/dashboard'} />
            <SidebarLink href="/dashboard/monitors" icon={<Activity className="w-4 h-4" />} label="Monitors" active={pathname?.startsWith('/dashboard/monitors')} />
            <SidebarLink href="/dashboard/activity" icon={<Clock className="w-4 h-4" />} label="Activity" active={pathname === '/dashboard/activity'} />
            <SidebarLink href="/dashboard/guards" icon={<ShieldCheck className="w-4 h-4" />} label="Replays" active={pathname === '/dashboard/guards'} />
            <SidebarLink href="/dashboard/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={pathname === '/dashboard/analytics'} />
            <div className="border-t border-border/5 my-8" />
            <SidebarLink href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" active={pathname?.startsWith('/dashboard/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-acid-lime/10 text-acid-lime font-semibold border border-acid-lime/20 shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.05)]' 
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      }`}
    >
      <span className={`${active ? 'text-acid-lime' : 'group-hover:text-acid-lime'} transition-colors`}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
