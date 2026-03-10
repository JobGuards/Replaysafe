'use client'

import useSWR from 'swr'
import { api } from '@/lib/api'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Activity, Clock, AlertTriangle, CheckCircle, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

const fetcher = () => api.getMonitors()

export function MonitorList() {
  const { data: monitors, error, isLoading } = useSWR('/monitors', fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  })

  if (isLoading) {
    return <div className="flex justify-center p-8 text-muted-foreground">Loading monitors...</div>
  }

  if (error) {
    return <div className="flex justify-center p-8 text-destructive">Failed to load monitors.</div>
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
        <Activity className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
        <h3 className="text-lg font-semibold">No monitors yet</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-sm">
          You haven't created any monitors. Start by adding a heartbeat monitor for your cron jobs or backups.
        </p>
        <Link href="/monitors/new">
          <Button>Create your first monitor</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Last Heartbeat</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monitors.map((monitor: any) => (
            <TableRow key={monitor.id}>
              <TableCell>
                <StatusBadge status={monitor.status} />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`/monitors/${monitor.id}`} className="hover:underline">
                  {monitor.name}
                </Link>
                {monitor.description && (
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {monitor.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {monitor.schedule}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {monitor.lastHeartbeatAt 
                  ? formatDistanceToNow(new Date(monitor.lastHeartbeatAt), { addSuffix: true })
                  : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/monitors/${monitor.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/monitors/${monitor.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Pause
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'UP':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 capitalize">
          <CheckCircle className="h-3 w-3" /> Up
        </Badge>
      )
    case 'DOWN':
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 capitalize">
          <AlertTriangle className="h-3 w-3" /> Down
        </Badge>
      )
    case 'DEGRADED':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 capitalize">
          <Clock className="h-3 w-3" /> Degraded
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1 capitalize">
          {status.toLowerCase()}
        </Badge>
      )
  }
}
