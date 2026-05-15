'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { 
  Check, 
  ChevronsUpDown, 
  PlusCircle, 
  Shield, 
  LayoutGrid,
  Search,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from './CreateProjectModal'

export function ProjectSwitcher() {
  const { organizations, activeOrganization, setActiveOrganization } = useAuth()
  const [open, setOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-foreground/[0.03] border border-border/10 hover:bg-foreground/[0.05] transition-all group focus:outline-none focus:ring-2 focus:ring-acid-lime/20">
          <div className="w-8 h-8 rounded-lg bg-acid-lime/10 border border-acid-lime/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <Building2 className="w-4 h-4 text-acid-lime" />
          </div>
          <div className="flex flex-col items-start min-w-[120px]">
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Active_Project</span>
            <span className="text-sm font-bold text-foreground truncate max-w-[150px]">
              {activeOrganization?.name || 'Select Project'}
            </span>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground/40 group-hover:text-acid-lime transition-colors" />
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="w-[300px] p-0 glass-panel border border-border/10 bg-background/90 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl"
      >
        <Command className="bg-transparent">
          <div className="flex items-center border-b border-border/5 px-3">
            <CommandInput 
              placeholder="Search projects..." 
              value={search}
              onValueChange={setSearch}
              className="h-12 bg-transparent border-none focus:ring-0 uppercase text-[10px] font-bold tracking-widest"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="p-4 text-center">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No projects found.</p>
            </CommandEmpty>
            <CommandGroup className="p-2">
              <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">Your Organizations</DropdownMenuLabel>
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    setActiveOrganization(org.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-foreground/[0.05]  transition-colors group"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                    org.id === activeOrganization?.id 
                      ? " border-acid-lime/30 text-acid-lime" 
                      : "bg-foreground/5 border-border/10 text-muted-foreground group-hover:border-acid-lime/20"
                  )}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-xs font-bold text-foreground">{org.name}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                      {org.role} • {org.plan}
                    </span>
                  </div>
                  {org.id === activeOrganization?.id && (
                    <Check className="w-4 h-4 text-acid-lime animate-in zoom-in duration-300" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          
          <div className="p-2 border-t border-border/5">
            <button 
              onClick={() => {
                setOpen(false)
                setIsCreateModalOpen(true)
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-foreground/[0.05] transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-border/10 flex items-center justify-center group-hover:border-acid-lime/20 transition-all">
                <PlusCircle className="w-4 h-4 text-muted-foreground group-hover:text-acid-lime" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground">New Project</span>
            </button>
          </div>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>

    <CreateProjectModal 
      isOpen={isCreateModalOpen} 
      onClose={() => setIsCreateModalOpen(false)} 
    />
    </>
  )
}
