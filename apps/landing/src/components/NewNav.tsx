"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";
import { User } from "lucide-react";

type Props = {
  userEmail: string | null;
};

export function NewNav({ userEmail }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "";

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50 px-2 py-2 glass-panel bg-background/40 backdrop-blur-2xl border border-border/10 rounded-[2rem] shadow-2xl shadow-black/50 flex justify-between items-center transition-all duration-500 hover:bg-background/60 hover:border-border/20">
      <div className="pl-4">
        <Logo />
      </div>

      {/* Central Navigation Pill */}
      <nav className="hidden md:flex items-center gap-1 bg-foreground/[0.03] border border-border/5 p-1 rounded-full">
        <Link className="px-5 py-2 rounded-full text-sm font-bold text-acid-lime bg-acid-lime/[0.08] hover:bg-acid-lime/[0.15] border border-acid-lime/20 shadow-[0_0_15px_rgba(var(--theme-lime-rgb),0.1)] transition-all duration-300 tracking-widest uppercase text-[10px]" href={`${dashboardUrl}/dashboard`}>
          Dashboard
        </Link>
        <Link className="px-5 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-300 tracking-widest uppercase text-[10px]" href="/docs">
          Docs
        </Link>
        <Link className="px-5 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-300 tracking-widest uppercase text-[10px]" href="http://localhost:3001/pricing" target="_blank">
          Managed
        </Link>
      </nav>

      <div className="flex items-center gap-2 pr-2 relative">
        {/* <ProjectSwitcher /> */}
        <div className="h-6 w-[1px] bg-border/10 mx-1" />
        <ModeToggle />
        {userEmail ? (
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative group focus:outline-none flex items-center justify-center ml-2"
            >
              <div className={`w-10 h-10 rounded-full bg-surface-container-high border ${isProfileOpen ? 'border-acid-lime/50 ring-2 ring-acid-lime/20' : 'border-outline-variant/50'} flex items-center justify-center overflow-hidden hover:border-acid-lime/50 transition-colors duration-300 ring-2 ring-transparent hover:ring-acid-lime/20`}>
                <User className="w-5 h-5 text-on-surface" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-acid-lime rounded-full border-2 border-background animate-pulse"></span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-4 p-4 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col items-end min-w-[240px] shadow-2xl z-50 bg-background/90 backdrop-blur-xl">
                <span className="text-muted-foreground text-[10px] font-bold opacity-60 uppercase tracking-widest mb-2">Local Sovereign</span>
                <span className="text-foreground text-sm font-bold mb-4">{userEmail}</span>
                <Link href={`${dashboardUrl}/dashboard`} className="w-full text-center bg-acid-lime/10 hover:bg-acid-lime/20 text-acid-lime font-bold tracking-widest uppercase text-[10px] py-3 rounded-xl border border-acid-lime/20 transition-colors">
                  Open Hub
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link href={`${dashboardUrl}/auth/signin`} className="ml-2 bg-foreground text-background px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:opacity-90 hover:scale-105 transition-all duration-300">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
