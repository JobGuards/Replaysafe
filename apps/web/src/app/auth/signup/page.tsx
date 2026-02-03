'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff, Loader2, Check } from 'lucide-react'

export default function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: 'No password' }
    if (pwd.length < 8) return { strength: 1, label: 'Weak' }
    if (pwd.length < 12 && !/[A-Z]/.test(pwd)) return { strength: 2, label: 'Fair' }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { strength: 3, label: 'Strong' }
    return { strength: 2, label: 'Fair' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!agreeToTerms) {
      setError('You must agree to the terms of service')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Replace with your backend API call
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fullName, email, password }),
      // })

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      console.log('[v0] Sign up with:', { fullName, email, password })
      // TODO: Handle successful signup - redirect to dashboard or verification page
      // if (response.ok) {
      //   const data = await response.json()
      //   localStorage.setItem('token', data.token)
      //   window.location.href = '/dashboard'
      // }
      
      // For now, redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Failed to sign up. Please try again.')
      console.error('[v0] Sign up error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
        <p className="text-muted-foreground">Join StillUp and stop silent failures</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            required
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength */}
          {password && (
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength.strength === 1
                      ? 'w-1/3 bg-destructive'
                      : passwordStrength.strength === 2
                        ? 'w-2/3 bg-accent'
                        : 'w-full bg-primary'
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium ${
                  passwordStrength.strength === 1
                    ? 'text-destructive'
                    : passwordStrength.strength === 2
                      ? 'text-accent'
                      : 'text-primary'
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            At least 8 characters, mix of uppercase, numbers recommended
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmPassword && password === confirmPassword && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Check className="w-4 h-4" />
              Passwords match
            </div>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            disabled={isLoading}
            className="mt-1 w-4 h-4 border border-border bg-secondary rounded cursor-pointer accent-primary"
          />
          <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer flex-1">
            I agree to the{' '}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Sign Up Button */}
        <Button
          type="submit"
          disabled={isLoading || !fullName || !email || !password || !confirmPassword || !agreeToTerms}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* Social Auth */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          className="border-border text-foreground hover:bg-secondary bg-transparent"
        >
          GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          className="border-border text-foreground hover:bg-secondary bg-transparent"
        >
          Google
        </Button>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-primary hover:text-primary/80 transition font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  )
}
