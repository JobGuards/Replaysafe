import { CreateMonitorForm } from '@/components/CreateMonitorForm'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMonitorPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <Link href="/monitors">
          <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to Monitors
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Monitor</h1>
        <p className="text-muted-foreground">
          Set up a new heartbeat monitor for your scheduled jobs.
        </p>
      </div>
      
      <CreateMonitorForm />
    </div>
  )
}
