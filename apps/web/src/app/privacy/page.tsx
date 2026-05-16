import React from 'react'

export const metadata = {
  title: 'Privacy Policy | StillUp',
  description: 'How we handle your data at StillUp.',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-8">Privacy Policy</h1>
      
      <div className="glass-panel border border-border/10 rounded-3xl p-8 md:p-12 space-y-8 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 uppercase tracking-tight">1. Data Collection</h2>
          <p>
            StillUp is designed as a local-first monitoring infrastructure. We collect minimal information required to provide our service:
          </p>
          <ul className="list-disc ml-6 mt-4 space-y-2">
            <li>Account Information: Email and name for authentication.</li>
            <li>Monitor Metadata: Names and schedules of the jobs you monitor.</li>
            <li>Heartbeat Logs: Execution status, duration, and output (if provided) of your monitored jobs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 uppercase tracking-tight">2. Data Storage & Residency</h2>
          <p>
            Your data is stored in the PostgreSQL database provided via your environment configuration. StillUp does not centrally store your monitor logs unless you are using a managed cloud offering. For self-hosted instances, you maintain full control over your data residency.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 uppercase tracking-tight">3. Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul className="list-disc ml-6 mt-4 space-y-2">
            <li>Encryption of passwords using bcrypt.</li>
            <li>Secure API Key generation and management.</li>
            <li>Protection against common web vulnerabilities (XSS, SQLi, CSRF).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 uppercase tracking-tight">4. Third-Party Services</h2>
          <p>
            We may use third-party services like Stripe for billing and Sentry for error tracking. Each service has its own privacy policy regarding the data they process.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-4 uppercase tracking-tight">5. Contact</h2>
          <p>
            For any privacy-related concerns, please reach out to us at <span className="text-acid-lime font-bold">pallavikumari2000mdb@gmail.com</span>.
          </p>
        </section>
        
        <div className="pt-8 border-t border-border/10">
          <p className="text-xs italic opacity-60">Last Updated: May 16, 2026</p>
        </div>
      </div>
    </div>
  )
}
