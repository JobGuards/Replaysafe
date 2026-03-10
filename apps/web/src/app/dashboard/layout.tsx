'use client'

import React from "react"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, Settings, Home, BarChart3, Clock, Ear as Gear, Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-border bg-secondary/50 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition text-foreground"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">
                S
              </div>
              <span className="font-bold text-foreground text-lg hidden sm:inline">StillUp</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings">
              <button className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </Link>
            <button
              // onClick={signout}
              className="p-2 hover:bg-secondary rounded-lg transition text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-border bg-secondary/30 transition-transform z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <nav className="p-6 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
              onClick={() => setSidebarOpen(false)}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/activity"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              onClick={() => setSidebarOpen(false)}
            >
              <Clock className="w-5 h-5" />
              Activity
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              onClick={() => setSidebarOpen(false)}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
            <div className="border-t border-border my-4" />
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
