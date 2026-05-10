'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SigninPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn('email', { email, callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Signin error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-panel w-full border border-border/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-acid-lime to-transparent"></div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">Enter your email for a secure magic link login.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
            Email Address
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-acid-lime transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="h-14 pl-12 bg-background/50 border-border/20 focus:border-acid-lime/50 rounded-xl transition-all font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button 
          className="w-full h-14 bg-acid-lime text-primary-foreground hover:opacity-90 rounded-xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.2)] hover:shadow-[0_0_35px_rgba(var(--theme-lime-rgb),0.4)] transition-all flex items-center justify-center gap-2 group" 
          type="submit" 
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Get Magic Link
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>

        <div className="pt-4 border-t border-border/10">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-foreground font-bold hover:text-acid-lime transition-colors underline underline-offset-4 decoration-acid-lime/30">
              Create one for free
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
