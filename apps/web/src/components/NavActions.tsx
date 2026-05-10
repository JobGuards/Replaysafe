"use client";

import Link from "next/link";

export function NavActions() {
  return (
    <div className="flex items-center gap-xs">
      <Link 
        href="/dashboard" 
        className="text-on-surface-variant font-body-md hover:text-on-surface transition-all duration-300"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
