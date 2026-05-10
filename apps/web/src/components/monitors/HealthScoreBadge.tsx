'use client'

import React from 'react'

export function HealthScoreBadge({ score }: { score: number | null | undefined }) {
  const safeScore = score ?? 100
  
  let label = 'Perfect'
  let color = 'text-acid-lime border-acid-lime/30 bg-acid-lime/5'

  if (safeScore < 60) {
    label = 'Critical'
    color = 'text-destructive border-destructive/30 bg-destructive/5'
  } else if (safeScore < 90) {
    label = 'Fair'
    color = 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5'
  }

  return (
    <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${color}`}>
      {label} {Math.round(safeScore)}%
    </div>
  )
}
