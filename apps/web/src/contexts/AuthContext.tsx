'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  fullName: string
  emailVerified: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

interface AuthContextType {
  user: User | null
  organizations: Organization[]
  isLoading: boolean
  isAuthenticated: boolean
  signout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/auth/me', {
        credentials: 'include', // Important: send cookies
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setOrganizations(data.organizations || [])
      } else {
        setUser(null)
        setOrganizations([])
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setUser(null)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  const signout = async () => {
    try {
      await fetch('http://localhost:4000/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setOrganizations([])
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const refetch = async () => {
    setIsLoading(true)
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        isLoading,
        isAuthenticated: !!user,
        signout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
