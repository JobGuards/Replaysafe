"use client";

import React from "react";

export function HeartbeatPulse({ monitorId }: { monitorId: string }) {
  // Mocking the pulse data for visualization
  // In a real app, this would be fetched or passed in
  const bars = Array.from({ length: 40 }).map((_, i) => ({
    status: Math.random() > 0.05 ? "up" : "down",
    height: 4 + Math.random() * 12,
  }));

  return (
    <div className="flex items-end gap-[2px] h-4 w-full">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full transition-all duration-500 ${bar.status === "up" ? "bg-acid-lime/40 group-hover:bg-acid-lime" : "bg-destructive/60"}`}
          style={{ height: `${bar.height}px` }}
        />
      ))}
    </div>
  );
}
