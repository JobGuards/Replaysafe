"use client";

import Link from "next/link";
import { useState } from "react";
import { NavActions } from "./NavActions";
import { ModeToggle } from "./ModeToggle";

type Props = {
  userEmail: string | null;
};

export function NewNav({ userEmail }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="fixed mt-4 left-1/2 -translate-x-1/2 w-[calc(100%-2*theme(spacing.margin))] z-50 flex justify-between items-center px-md py-sm max-w-[1600px] mx-auto glass-panel rounded-full border border-outline-variant/20 backdrop-blur-xl transition-all duration-300">
      <Link href="/" className="text-headline-md font-headline-md font-bold text-on-background tracking-tighter group cursor-pointer shrink-0">
        <span className="tracking-[0.2em] font-black uppercase text-on-background group-hover:text-acid-lime transition-colors duration-500" style={{ textShadow: "0 0 10px rgba(228, 225, 237, 0.2)" }}>StillUp</span>
        <span className="text-acid-lime">.</span>
      </Link>
      <nav className="hidden md:flex gap-md">
        <Link className="text-acid-lime font-bold tracking-wider hover:glow-lime transition-all duration-300 relative group" href="/dashboard">
          Dashboard
          <span className="absolute -bottom-1 left-0 w-full h-px bg-acid-lime scale-x-100 transition-transform duration-300"></span>
        </Link>
        <Link className="text-on-surface-variant font-body-md hover:text-on-surface hover:tracking-widest transition-all duration-300 relative group" href="/docs">
          Docs
          <span className="absolute -bottom-1 left-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
        </Link>
        <Link className="text-on-surface-variant font-body-md hover:text-on-surface hover:tracking-widest transition-all duration-300 relative group" href="/pricing">
          Pricing
          <span className="absolute -bottom-1 left-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
        </Link>
      </nav>
      <div className="flex items-center gap-sm relative">
        <ModeToggle />
        <NavActions />
        {userEmail ? (
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative group focus:outline-none flex items-center justify-center"
            >
              <div className={`w-10 h-10 rounded-full bg-surface-container-high border ${isProfileOpen ? 'border-acid-lime/50 ring-2 ring-acid-lime/20' : 'border-outline-variant/50'} flex items-center justify-center overflow-hidden hover:border-acid-lime/50 transition-colors duration-300 ring-2 ring-transparent hover:ring-acid-lime/20`}>
                <span className="material-symbols-outlined text-on-surface text-lg">person</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-acid-lime rounded-full border-2 border-background animate-pulse"></span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 p-4 glass-panel rounded-xl border border-outline-variant/30 flex flex-col items-end min-w-[240px] shadow-2xl z-50">
                <span className="text-on-surface-variant text-[10px] font-code-md opacity-60 uppercase tracking-tighter mb-1">Verified User</span>
                <span className="text-on-surface text-label-sm font-label-sm mb-4">{userEmail}</span>
                <Link href="/dashboard" className="w-full text-center bg-surface-container hover:bg-surface-container-highest transition-colors text-on-surface py-2 rounded-lg text-sm border border-outline-variant/20">
                  Open Dashboard
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/signin" className="bg-surface-container-high px-4 py-2 rounded-full text-sm hover:bg-surface-container-highest transition-colors">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
