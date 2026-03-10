import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { MonitorList } from '@/components/MonitorList'

export default function MonitorsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Manage and track your scheduled jobs and heartbeats.
          </p>
        </div>
        <Link href="/monitors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Monitor
          </Button>
        </Link>
      </div>
      
      <MonitorList />
    </div>
  )
}
