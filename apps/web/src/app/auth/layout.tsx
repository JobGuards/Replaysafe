import React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Logo/branding */}
      <div className="mb-8 text-center relative z-10">
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground mx-auto mb-4">
          S
        </div>
        <h1 className="text-2xl font-bold text-foreground">StillUp</h1>
        <p className="text-muted-foreground text-sm mt-2">Heartbeat monitoring with memory</p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
