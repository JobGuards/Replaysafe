import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background bg-tech-grid text-foreground flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="radial-glow-hero"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Branding */}
        <div className="mb-12 text-center group">
          <Logo className="flex-col !gap-6 scale-150 mb-8" />
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] mt-4 opacity-60">
            Infrastructure Sentinel
          </p>
        </div>

        <div className="w-full max-w-[440px]">{children}</div>

        {/* Footer link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-[10px] font-black text-muted-foreground hover:text-acid-lime transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
