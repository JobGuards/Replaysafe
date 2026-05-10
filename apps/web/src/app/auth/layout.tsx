import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background bg-tech-grid text-foreground flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="radial-glow-hero"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Branding */}
        <div className="mb-12 text-center group">
          <Link href="/" className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-acid-lime flex items-center justify-center font-black text-2xl text-primary-foreground shadow-[0_0_30px_rgba(var(--theme-lime-rgb),0.3)] group-hover:shadow-[0_0_50px_rgba(var(--theme-lime-rgb),0.5)] transition-all duration-500 transform group-hover:scale-110">
              S
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                StillUp<span className="text-acid-lime">.</span>
              </h1>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">
                Heartbeat Monitoring
              </p>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[440px]">
          {children}
        </div>

        {/* Footer link */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-[10px] font-black text-muted-foreground hover:text-acid-lime transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2 group">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
