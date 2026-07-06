"use client";

import React from "react";

interface HealthScoreBadgeProps {
  score: number;
  status: "optimal" | "warning" | "critical";
}

export function HealthScoreBadge({ score, status }: HealthScoreBadgeProps) {
  const color =
    status === "optimal"
      ? "text-acid-lime"
      : status === "warning"
        ? "text-orange-500"
        : "text-destructive";

  const bgColor =
    status === "optimal"
      ? "bg-acid-lime/10"
      : status === "warning"
        ? "bg-orange-500/10"
        : "bg-destructive/10";

  // Circle properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center p-4">
      <svg className="w-24 h-24 transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-foreground/5"
        />
        {/* Progress Circle */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black tracking-tighter text-foreground">
          {score}
        </span>
        <span
          className={`text-[8px] font-black uppercase tracking-[0.2em] ${color}`}
        >
          Score
        </span>
      </div>

      {/* Pulsing Dot */}
      <div
        className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
          status === "optimal"
            ? "bg-acid-lime shadow-[0_0_8px_rgba(var(--theme-lime-rgb),0.6)]"
            : "bg-orange-500"
        } animate-pulse`}
      />
    </div>
  );
}
