'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Check, AlertCircle } from 'lucide-react'

export default function Settings() {
  const [fullName, setFullName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

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
