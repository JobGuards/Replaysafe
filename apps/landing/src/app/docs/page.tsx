'use client'

import React from 'react'
import { 
  BookOpen, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Zap,
  Lock,
  History
} from 'lucide-react'
import Link from 'next/link'
import { ModeToggle } from '@/components/ModeToggle'

export default function DocsPage() {
  const categories = [
    {
      title: 'Getting Started',
      icon: <Zap className="w-6 h-6" />,
      items: [
        { title: 'Introduction', href: '/docs/introduction', description: 'The vision behind StillUp and core monitoring pillars.' },
        { title: 'Quick Start', href: '/docs/introduction#quick-start', description: 'Get your first heartbeat monitor running in 60 seconds.' },
      ]
    },
    {
      title: 'Infrastructure',
      icon: <Layers className="w-6 h-6" />,
      items: [
        { title: 'Self-Hosted Guide', href: '/docs/self-hosting', description: 'Strategies for homelabs, media stacks, and local AI stability.' },
        { title: 'Architecture & Deployment', href: '/docs/architecture', description: 'A deep dive into our modular stack and advanced deployment strategies.' },
      ]
    },
    {
      title: 'Security & Auth',
      icon: <ShieldCheck className="w-6 h-6" />,
      items: [
        { title: 'RBAC Roles', href: '/docs/architecture#rbac', description: 'Managing projects with Owner, Admin, and Member roles.' },
        { title: 'Encryption', href: '/docs/architecture#encryption', description: 'How we protect your secrets at rest using AES-256-GCM.' },
      ]
    },
    {
      title: 'API Reference',
      icon: <Terminal className="w-6 h-6" />,
      items: [
        { title: 'Heartbeat API', href: '/docs/api-reference', description: 'Payload specs for pushing heartbeats to StillUp.' },
        { title: 'Intelligence API', href: '/docs/api-reference#intelligence-api', description: 'Querying health scores and failure patterns.' },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background p-6 sm:p-24 selection:bg-acid-lime selection:text-primary-foreground relative">
      <div className="absolute top-8 right-8 z-50">
        <ModeToggle />
      </div>
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 text-acid-lime">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Documentation</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-foreground uppercase italic">
            Knowledge <span className="text-acid-lime">Base</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl font-medium">
            Everything you need to build, scale, and secure your monitoring infrastructure with StillUp.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {categories.map((category) => (
            <div key={category.title} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-acid-lime/10 text-acid-lime border border-acid-lime/20">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">{category.title}</h2>
              </div>
              
              <div className="space-y-4">
                {category.items.map((item) => (
                  <Link 
                    key={item.title} 
                    href={item.href}
                    className="group block p-6 rounded-3xl border border-border/10 bg-card/50 backdrop-blur hover:border-acid-lime/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black uppercase tracking-widest text-sm group-hover:text-acid-lime transition-colors">
                        {item.title}
                      </h3>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-acid-lime" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/5">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-12 text-center italic">Advanced <span className="text-acid-lime">Intelligence</span> Built-In</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid-lime/10 flex items-center justify-center mx-auto mb-6 border border-acid-lime/20">
                <Lock className="w-6 h-6 text-acid-lime" />
              </div>
              <h4 className="font-black uppercase text-xs tracking-widest">Field Encryption</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Sensitive webhook URLs are never stored in plaintext. Encrypted at the field level.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid-lime/10 flex items-center justify-center mx-auto mb-6 border border-acid-lime/20">
                <History className="w-6 h-6 text-acid-lime" />
              </div>
              <h4 className="font-black uppercase text-xs tracking-widest">Audit Logs</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Full traceability for every mutation. Know exactly who changed what and when.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-acid-lime/10 flex items-center justify-center mx-auto mb-6 border border-acid-lime/20">
                <Activity className="w-6 h-6 text-acid-lime" />
              </div>
              <h4 className="font-black uppercase text-xs tracking-widest">Pattern Detection</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Identify recurring failure windows and flapping monitors automatically.</p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center pt-12">
          <p className="text-muted-foreground text-sm font-medium">
            Need custom help? <span className="text-foreground font-black uppercase tracking-widest cursor-pointer hover:text-acid-lime transition-colors">Join our Discord</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
