import { CreateMonitorForm } from '@/components/CreateMonitorForm'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Globe } from 'lucide-react'
import Link from 'next/link'

export default function NewMonitorPage() {
  return (
    <div className="max-w-[900px] mx-auto w-full px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Premium Header */}
      <div className="bg-foreground/[0.02] p-12 rounded-[3rem] border border-border/5 relative overflow-hidden group">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-12 relative z-10">
          <div className="space-y-6">
            <Link href="/dashboard/monitors" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-acid-lime transition-colors">
              <ChevronLeft className="h-3 w-3" />
              Back to Infrastructure Hub
            </Link>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Deploy <span className="text-acid-lime">Sentinel</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Configure a high-fidelity monitor for your crons, backups, or secure network tunnels. 
              Real-time telemetry and proactive safety audits.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto w-full px-4">
        <CreateMonitorForm />
      </div>
    </div>
  )
}
