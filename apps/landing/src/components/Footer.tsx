"use client";

import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="w-full py-xl px-margin border-t border-border/10 bg-background/50 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-xl">
        <div className="flex flex-col gap-md">
          <Logo />
          <p className="text-body-md text-muted-foreground">
            If it didn't run, we tell you. If it failed, we remember.
          </p>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-outfit font-black text-foreground uppercase text-[10px] tracking-[0.2em] mb-2">
            Product
          </h4>
          <Link
            href="/dashboard"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/pricing"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Documentation
          </Link>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-outfit font-black text-foreground uppercase text-[10px] tracking-[0.2em] mb-2">
            Company
          </h4>
          <Link
            href="/docs"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            About
          </Link>
          <Link
            href="/docs"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/privacy"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Privacy
          </Link>
        </div>
        <div className="flex flex-col gap-sm">
          <h4 className="font-outfit font-black text-foreground uppercase text-[10px] tracking-[0.2em] mb-2">
            Connect
          </h4>
          <Link
            href="https://twitter.com/Replaysafe"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/Replaysafe"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="https://discord.gg/Replaysafe"
            className="text-body-md text-muted-foreground hover:text-acid-lime transition-colors"
          >
            Discord
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-xl pt-lg border-t border-outline-variant/10 text-center md:text-left">
        <p className="text-xs text-on-surface-variant opacity-60">
          © {new Date().getFullYear()} Replaysafe Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
