'use client'

import React from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'

interface LogoProps {
  className?: string
  iconOnly?: boolean
}

export function Logo({ className = '', iconOnly = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-acid-lime flex items-center justify-center shadow-lg shadow-acid-lime/20 group-hover:scale-110 transition-transform">
        <Shield className="w-4 h-4 text-primary-foreground" />
      </div>
      {!iconOnly && (
        <span className="font-black tracking-tighter text-xl uppercase italic text-foreground">
          Replay<span className="text-acid-lime">safe</span>
        </span>
      )}
    </Link>
  )
}
