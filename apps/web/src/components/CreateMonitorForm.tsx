'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createMonitorSchema, type CreateMonitorInput } from '@stillup/shared'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Lock, Shield, Info } from 'lucide-react'

export function CreateMonitorForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateMonitorInput>({
    resolver: zodResolver(createMonitorSchema as any),
    defaultValues: {
      name: '',
      description: '',
      type: 'HEARTBEAT',
      schedule: '* * * * *',
      scheduleType: 'CRON',
      graceSeconds: 300,
      timezone: 'UTC',
      alertOnLate: true,
      notifyAfterSeconds: 0,
      config: {
        threshold: 180,
      },
    },
  })

  const monitorType = form.watch('type')

  async function onSubmit(values: CreateMonitorInput) {
    setIsSubmitting(true)
    try {
      await api.createMonitor(values)
      toast.success('Monitor created successfully')
      router.push('/dashboard/monitors')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create monitor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/10 shadow-2xl bg-card/30 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-10 border-b border-border/5 bg-foreground/[0.02]">
        <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Configure Monitor</CardTitle>
      </CardHeader>
      <CardContent className="p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Monitor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Production WireGuard" className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10 focus:border-acid-lime/50 transition-all" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Monitor Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/10 shadow-2xl">
                        <SelectItem value="HEARTBEAT">General Heartbeat</SelectItem>
                        <SelectItem value="TUNNEL">Secure Tunnel (WireGuard/SSH)</SelectItem>
                        <SelectItem value="CERTIFICATE">SSL/TLS Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What is the purpose of this monitor?" 
                      className="resize-none rounded-2xl bg-foreground/[0.03] border-border/10 min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {monitorType === 'TUNNEL' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-10 rounded-[2.5rem] bg-acid-lime/[0.03] border border-acid-lime/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Lock className="w-24 h-24 text-acid-lime" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-acid-lime flex items-center justify-center shadow-lg shadow-acid-lime/20">
                      <Shield className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground italic">Tunnelight Protocol</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Infrastructure Configuration</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Public Key (Read-only)</FormLabel>
                        <Info className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="WireGuard Public Key" 
                          className="h-14 rounded-2xl bg-background/50 border-border/10 focus:border-acid-lime/40 transition-all font-mono text-xs"
                          onChange={(e) => {
                            const currentConfig = form.getValues('config') || {}
                            form.setValue('config', { ...currentConfig, publicKey: e.target.value })
                          }}
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tunnel Endpoint</FormLabel>
                        <Info className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="vpn.hq.example.com:51820" 
                          className="h-14 rounded-2xl bg-background/50 border-border/10 focus:border-acid-lime/40 transition-all"
                          onChange={(e) => {
                            const currentConfig = form.getValues('config') || {}
                            form.setValue('config', { ...currentConfig, endpoint: e.target.value })
                          }}
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Handshake Threshold (Sec)</FormLabel>
                        <Info className="w-3 h-3 text-muted-foreground/40" />
                      </div>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="180" 
                          defaultValue="180"
                          className="h-14 rounded-2xl bg-background/50 border-border/10 focus:border-acid-lime/40 transition-all"
                          onChange={(e) => {
                            const currentConfig = form.getValues('config') || {}
                            form.setValue('config', { ...currentConfig, threshold: Number(e.target.value) })
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] mt-2">Alert if no handshake detected for this duration.</FormDescription>
                    </FormItem>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <FormField
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Check Schedule</FormLabel>
                    <FormControl>
                      <Input placeholder="* * * * *" className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Schedule Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-border/10">
                        <SelectItem value="CRON">Cron Expression</SelectItem>
                        <SelectItem value="SIMPLE">Simple Interval</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <FormField
                control={form.control}
                name="graceSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Grace Period (Sec)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-acid-lime">Timezone</FormLabel>
                    <FormControl>
                      <Input placeholder="UTC" className="h-14 rounded-2xl bg-foreground/[0.03] border-border/10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="alertOnLate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-[2rem] border border-border/10 p-8 bg-foreground/[0.02]">
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-black uppercase tracking-tight italic">Intelligent Alerts</FormLabel>
                    <FormDescription className="text-xs">
                      Notify immediately if heartbeats are late or performance degrades.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-16 text-sm font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-acid-lime/20 group" disabled={isSubmitting}>
              {isSubmitting ? 'Syncing...' : (
                <div className="flex items-center gap-3">
                  Deploy Monitor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
