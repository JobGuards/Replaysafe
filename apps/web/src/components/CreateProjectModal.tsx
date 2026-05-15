'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2, Rocket, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { refetch, setActiveOrganization } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    try {
      const project = await api.createProject(name)
      toast.success(`Project "${name}" created successfully!`)
      
      // Refresh user data to get the new project list
      await refetch()
      
      // Switch to the new project
      setActiveOrganization(project.id)
      
      onClose()
      setName('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border border-border/10 bg-background/90 backdrop-blur-2xl rounded-[2.5rem] p-12 !w-[500px] !max-w-[90vw] shadow-2xl overflow-hidden flex flex-col gap-0">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Rocket className="w-32 h-32 text-acid-lime" />
        </div>
        
        <DialogHeader className="relative z-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-acid-lime" />
          </div>
          <DialogTitle className="text-3xl font-black uppercase tracking-tight italic text-foreground leading-none">
            Initialize_ <span className="text-acid-lime">Project</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium text-base leading-relaxed">
            Provision a new security perimeter for your infrastructure monitors and background jobs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6 relative z-10">
          <div className="space-y-4">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 ml-1">
              Project Name
            </Label>
            <div className="relative group">
              <Input
                id="name"
                placeholder="e.g. Sentinel Alpha"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="h-14 bg-foreground/[0.03] border-border/10 rounded-2xl px-6 font-bold text-lg focus:border-acid-lime/50 focus:ring-acid-lime/20 transition-all placeholder:opacity-30"
              />
              <div className="absolute inset-0 rounded-2xl bg-acid-lime/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-foreground/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 h-14 rounded-2xl bg-acid-lime text-[#0f1a14] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-acid-lime/10 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Deploy Protocol</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
