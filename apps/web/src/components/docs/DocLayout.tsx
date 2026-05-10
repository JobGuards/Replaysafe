'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ModeToggle } from '@/components/ModeToggle'
import { Logo } from '@/components/Logo'
import { Zap, Shield, Terminal, BookOpen, ChevronRight, Lock, ShieldAlert } from 'lucide-react'

interface DocLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  category?: string
}

export function DocLayout({ children, title, subtitle, category }: DocLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { 
      group: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs/introduction', icon: <Zap className="w-4 h-4" /> },
        { title: 'Architecture', href: '/docs/architecture', icon: <Shield className="w-4 h-4" /> },
      ]
    },
    {
      group: 'Infrastructure',
      items: [
        { title: 'Tunnel Monitoring', href: '/docs/tunnel-monitoring', icon: <Lock className="w-4 h-4" /> },
        { title: 'Security Sentinel', href: '/docs/security-sentinel', icon: <ShieldAlert className="w-4 h-4" /> },
      ]
    },
    {
      group: 'Reference',
      items: [
        { title: 'API Reference', href: '/docs/api-reference', icon: <Terminal className="w-4 h-4" /> },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background transition-colors duration-500 selection:bg-acid-lime selection:text-primary-foreground font-inter">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-80 p-10 border-r border-border/5 hidden lg:block h-screen sticky top-0 bg-card/10 backdrop-blur-3xl overflow-y-auto">
          <div className="space-y-12">
            <Logo />

            <div className="space-y-10">
              {navItems.map((group) => (
                <div key={group.group} className="space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 px-4">{group.group}</h2>
                  <nav className="flex flex-col gap-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isActive 
                              ? 'bg-acid-lime text-primary-foreground shadow-xl shadow-acid-lime/10' 
                              : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            {item.title}
                          </div>
                          {isActive && <ChevronRight className="w-3 h-3" />}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>

            <div className="pt-12 border-t border-border/5">
              <p className="text-[10px] font-bold text-muted-foreground/40 px-4">v1.2.0-sentinel</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="h-20 flex items-center justify-between px-8 sm:px-16 lg:px-24 border-b border-border/5 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              <Link href="/docs" className="hover:text-acid-lime transition-colors">Documentation</Link>
              <ChevronRight className="w-3 h-3 opacity-30" />
              <span className="text-foreground/60">{category || 'Guide'}</span>
            </div>
            <ModeToggle />
          </header>

          <main className="p-8 sm:p-16 lg:p-24 max-w-4xl mx-auto w-full">
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="space-y-6">
                {subtitle && (
                  <div className="flex items-center gap-2 text-acid-lime">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{subtitle}</span>
                  </div>
                )}
                <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase italic leading-[0.9]">
                  {title}
                </h1>
              </div>

              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed font-medium">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
