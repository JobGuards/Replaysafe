import useSWR from 'swr'
import { api } from '@/lib/api'
import { Activity, Plus, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HeartbeatMonitorCard } from './monitors/HeartbeatMonitorCard'
import { TunnelStatusCard } from './monitors/TunnelStatusCard'

const fetcher = () => api.getMonitors()

export function MonitorList() {
  const { data: monitors, error, isLoading } = useSWR('/monitors', fetcher, {
    refreshInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-[2.5rem] bg-foreground/[0.03] animate-pulse border border-border/5" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] border border-destructive/20 bg-destructive/5 p-8 text-center">
        <h3 className="text-xl font-black uppercase italic text-destructive">Connection Lost</h3>
        <p className="text-sm text-destructive/70 mt-2">Failed to sync with the intelligence engine.</p>
      </div>
    )
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border/10 bg-foreground/[0.01] p-8 text-center group hover:border-acid-lime/20 transition-all duration-500">
        <div className="w-20 h-20 rounded-3xl bg-foreground/[0.03] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
          <Activity className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Silence detected</h3>
        <p className="mb-10 text-sm text-muted-foreground max-w-sm mt-4">
          Your infrastructure is currently invisible. Deploy your first heartbeat or secure tunnel monitor to begin.
        </p>
        <Link href="/monitors/new">
          <Button size="lg" className="rounded-2xl h-14 px-10 shadow-2xl shadow-acid-lime/20">
            <Plus className="w-4 h-4 mr-2" />
            Deploy First Monitor
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-acid-lime">Active Observability ({monitors.length})</h2>
        <div className="flex items-center gap-2 p-1 rounded-xl bg-foreground/[0.03] border border-border/5">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg bg-background shadow-sm"><LayoutGrid className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-muted-foreground"><List className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {monitors.map((monitor: any) => (
          monitor.type === 'TUNNEL' ? (
            <TunnelStatusCard key={monitor.id} monitor={monitor} />
          ) : (
            <HeartbeatMonitorCard key={monitor.id} monitor={monitor} />
          )
        ))}
      </div>
    </div>
  )
}
