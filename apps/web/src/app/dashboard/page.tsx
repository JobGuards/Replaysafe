'use client'

import React from 'react'
import useSWR from 'swr'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MonitorList } from '@/components/MonitorList'

const fetcher = () => api.getMonitors()
const incidentsFetcher = () => api.getIncidents()

export default function DashboardPage() {
  const { data: monitors } = useSWR('/monitors', fetcher, { refreshInterval: 10000 })
  const { data: incidents } = useSWR('/incidents', incidentsFetcher, { refreshInterval: 15000 })

  const totalMonitors = monitors?.length ?? 0
  const upMonitors = monitors?.filter((m: any) => m.status === 'UP').length ?? 0
  const downMonitors = monitors?.filter((m: any) => m.status === 'DOWN').length ?? 0
  const openIncidents = (incidents as any[])?.filter((i: any) => !i.resolvedAt).length ?? 0

  return (
    <div className="flex flex-col gap-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            System status and real-time monitoring overview.
          </p>
        </div>
        <Link href="/monitors/new">
          <Button className="bg-acid-lime text-primary-foreground gap-2 px-8 h-12 rounded-xl shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.2)] hover:shadow-[0_0_35px_rgba(var(--theme-lime-rgb),0.4)] transition-all font-bold group">
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" /> Create Monitor
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Monitors" 
          value={totalMonitors} 
          icon={<Activity className="h-5 w-5" />}
          subtitle="Configured endpoints"
        />

        <StatCard 
          title="Healthy" 
          value={upMonitors} 
          icon={<CheckCircle className="h-5 w-5" />}
          color="acid-lime"
          progress={totalMonitors > 0 ? (upMonitors / totalMonitors) * 100 : 0}
        />

        <StatCard 
          title="Down" 
          value={downMonitors} 
          icon={<AlertTriangle className="h-5 w-5" />}
          color={downMonitors > 0 ? "destructive" : "muted"}
          subtitle={downMonitors > 0 ? 'Action required' : 'System nominal'}
        />

        <StatCard 
          title="Incidents" 
          value={openIncidents} 
          icon={<Clock className="h-5 w-5" />}
          color={openIncidents > 0 ? "orange" : "muted"}
          link={openIncidents > 0 ? "/incidents" : undefined}
        />
      </div>

      {/* Monitor List Section */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Active Monitors</h2>
          <div className="flex items-center gap-3">
             <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Live</span>
             <div className="w-2.5 h-2.5 rounded-full bg-acid-lime animate-pulse shadow-[0_0_8px_#d9ff00]" />
          </div>
        </div>
        <div className="glass-panel rounded-3xl overflow-hidden border border-border/10 shadow-2xl">
           <MonitorList />
        </div>
      </section>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color = "muted", 
  progress,
  link
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  subtitle?: string; 
  color?: string;
  progress?: number;
  link?: string;
}) {
  const colorClasses = {
    "acid-lime": "text-acid-lime border-acid-lime/20 bg-acid-lime/[0.03]",
    "destructive": "text-destructive border-destructive/20 bg-destructive/[0.03]",
    "orange": "text-orange-500 border-orange-500/20 bg-orange-500/[0.03]",
    "muted": "text-muted-foreground border-border/10 bg-card/50"
  }[color] || "text-muted-foreground border-border/10 bg-card/50";

  const content = (
    <Card className={`relative overflow-hidden glass-panel border-t-2 ${colorClasses} transition-all duration-300 hover:-translate-y-1`}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{title}</CardTitle>
        <div className="opacity-40">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-black tracking-tighter">{value}</div>
        {progress !== undefined ? (
          <div className="flex items-center gap-3 mt-3">
             <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }}
                />
             </div>
             <span className="text-[10px] font-black opacity-60">{Math.round(progress)}%</span>
          </div>
        ) : (
          <p className="text-[10px] font-medium mt-2 opacity-60 uppercase tracking-wider">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}
