'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, Settings, Home, BarChart3, Clock, Ear as Gear, Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()
  // const { isAuthenticated, isLoading, signout } = useAuth()

  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     window.location.href = '/auth/signin'
  //   }
  // }, [isLoading, isAuthenticated])

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
  //         <p className="text-muted-foreground">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // if (!isAuthenticated) {
  //   return null
  // }

  return (
    <div className="min-h-screen bg-background bg-tech-grid relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="radial-glow-hero opacity-50"></div>

      {/* Top Navigation */}
      <header className="glass-panel sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-6 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary/50 rounded-lg transition text-foreground"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-acid-lime flex items-center justify-center font-bold text-primary-foreground shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.3)] group-hover:shadow-[0_0_25px_rgba(var(--theme-lime-rgb),0.5)] transition-all">
                S
              </div>
              <span className="font-bold text-foreground text-lg hidden sm:inline tracking-tighter">StillUp<span className="text-acid-lime">.</span></span>
            </Link>
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

      <div className="flex max-w-[1600px] mx-auto relative z-10">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-border/10 bg-background/50 backdrop-blur-md transition-transform z-40 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-6 space-y-2">
            <SidebarLink href="/dashboard" icon={<Home className="w-4 h-4" />} label="Dashboard" active={pathname === '/dashboard'} />
            <SidebarLink href="/dashboard/activity" icon={<Clock className="w-4 h-4" />} label="Activity" active={pathname === '/dashboard/activity'} />
            <SidebarLink href="/dashboard/analytics" icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={pathname === '/dashboard/analytics'} />
            <div className="border-t border-border/10 my-4" />
            <SidebarLink href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" active={pathname?.startsWith('/dashboard/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 lg:p-10 min-h-[calc(100vh-64px)] overflow-auto">
          <div className="max-w-6xl mx-auto">
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
