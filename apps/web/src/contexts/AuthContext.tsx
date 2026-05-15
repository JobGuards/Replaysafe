'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { mutate } from 'swr'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  fullName: string
  emailVerified: boolean
}

interface Organization {
  id: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  activeOrganization: Organization | null;
  setActiveOrganization: (id: string) => void;
  isLoading: boolean;
  isAuthenticated: boolean
  signin: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  refresh: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const activeOrganization = organizations.find(org => org.id === activeOrgId) || (organizations.length > 0 ? organizations[0] : null)

  const fetchUser = async () => {
    try {
      const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4040'
      const apiBase = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`
      const response = await fetch(`${apiBase}/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setOrganizations(data.projects || [])
        
        // Restore from localStorage or default to first project
        const storedId = localStorage.getItem('stillup_active_project')
        if (storedId && (data.projects || []).some((p: any) => p.id === storedId)) {
          setActiveOrgId(storedId)
        } else if (data.projects && data.projects.length > 0) {
          setActiveOrgId(data.projects[0].id)
        }
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

  const setActiveOrganization = (id: string) => {
    setActiveOrgId(id)
    localStorage.setItem('stillup_active_project', id)
    api.setProjectId(id)
    // Trigger global revalidation of all SWR hooks
    mutate(() => true, undefined, { revalidate: true })
  }

  const signout = async () => {
    try {
      const rawApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4040'
      const apiBase = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`
      await fetch(`${apiBase}/auth/signout`, {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setOrganizations([])
      setActiveOrgId(null)
      localStorage.removeItem('stillup_active_project')
      window.location.href = '/auth/signin'
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const signin = async (email: string, password: string) => {
    // This is handled in the page, but keeping here for consistency
    await fetchUser()
  }

  const signup = async (fullName: string, email: string, password: string) => {
    await fetchUser()
  }

  const refresh = async () => {
    await fetchUser()
  }

  const refetch = async () => {
    setIsLoading(true)
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // Sync the active project ID to the API client so all requests include it
  useEffect(() => {
    if (activeOrganization) {
      api.setProjectId(activeOrganization.id)
    } else {
      api.setProjectId(null)
    }
  }, [activeOrganization])

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        activeOrganization,
        setActiveOrganization,
        isLoading,
        isAuthenticated: !!user,
        signin,
        signup,
        signout,
        refresh,
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
