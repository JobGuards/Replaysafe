'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Check, AlertCircle, Key, Plus, Trash2, Copy, ShieldCheck } from 'lucide-react'
import { toast } from "sonner"
import useSWR from 'swr'
import { api } from "@/lib/api"

export default function Settings() {
  const { user } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  // Sync state if user data loads later
  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setEmail(user.email)
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('[v0] Updating profile:', { fullName, email })
      setSuccessMessage('Profile updated successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('[v0] Changing password')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage('Password changed successfully')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  // API Keys Logic
  const { data: apiKeys, mutate: mutateKeys } = useSWR('/api-keys', () => 
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/api-keys`, { credentials: 'include' }).then(r => r.json())
  )
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreatingKey, setIsCreatingKey] = useState(false)

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName) return
    setIsCreatingKey(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to create key')
      const newKey = await res.json()
      toast.success('API Key created successfully')
      setNewKeyName('')
      mutateKeys()
      
      navigator.clipboard.writeText(newKey.key)
      toast.info('API Key copied to clipboard! Keep it safe.')
    } catch (err) {
      toast.error('Failed to create API key')
    } finally {
      setIsCreatingKey(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Systems using this key will lose access.')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to delete key')
      toast.success('API Key revoked')
      mutateKeys()
    } catch (err) {
      toast.error('Failed to revoke API key')
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary rounded-lg flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight">Profile Information</h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-acid-lime text-primary-foreground hover:opacity-90 h-12 px-8 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.2)] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl">
          <h2 className="text-xl font-black text-foreground mb-6 uppercase tracking-tight">Change Password</h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-background/50 border-border/20 text-foreground h-12 focus:border-acid-lime/50 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-acid-lime text-primary-foreground hover:opacity-90 h-12 px-8 rounded-xl font-bold shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.2)] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </div>

        {/* API Keys Section */}
        <div className="glass-panel border border-border/10 rounded-2xl p-8 mb-8 shadow-xl bg-card/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                <Key className="w-5 h-5 text-acid-lime" /> API Keys
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Use these keys to authenticate with the StillUp CLI and ReplayGuard SDK.</p>
            </div>
          </div>

          <form onSubmit={handleCreateKey} className="flex gap-4 mb-10">
            <Input 
              placeholder="Key Name (e.g., Production Server)" 
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="bg-background/30 border-border/10 h-12 rounded-xl"
            />
            <Button type="submit" disabled={isCreatingKey || !newKeyName} className="bg-acid-lime text-primary-foreground gap-2 h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">
              {isCreatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Key
            </Button>
          </form>

          <div className="space-y-4">
            {apiKeys && apiKeys.length > 0 ? (
              apiKeys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-6 rounded-2xl bg-foreground/[0.02] border border-border/5 group hover:border-border/10 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10">
                      <ShieldCheck className="w-5 h-5 text-acid-lime/40" />
                    </div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm">{key.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                        </code>
                        <span className="text-[10px] text-muted-foreground/40 font-medium">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-acid-lime"
                      onClick={() => {
                        navigator.clipboard.writeText(key.key)
                        toast.success('Key copied to clipboard')
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border/5 rounded-3xl">
                <p className="text-muted-foreground text-sm font-medium italic">No active API keys found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-destructive/5 border border-destructive rounded-lg p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Danger Zone</h2>
          <p className="text-muted-foreground mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
          
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}
