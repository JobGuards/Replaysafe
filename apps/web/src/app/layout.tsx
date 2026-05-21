import React from "react"
import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from 'sonner'
import './globals.css'

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Replaysafe - Heartbeat Monitoring',
  description: 'Monitor your cron jobs and backups.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${inter.variable} font-inter antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            {children}
            <Toaster position="top-right" theme="dark" richColors />
            <Analytics />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
