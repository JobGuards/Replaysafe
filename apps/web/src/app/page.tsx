import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Brain, Clock, Lock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'StillUp - Heartbeat Monitoring with Memory',
  description: 'Monitor your cron jobs, backups, and scheduled tasks. If it fails, we remember it and help you fix it.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">●</span>
            </div>
            <span className="text-xl font-bold text-foreground">StillUp</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition">Features</Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition">Pricing</Link>
            <Link href="#compare" className="text-muted-foreground hover:text-foreground transition">Compare</Link>
            <Link href="/payment" className="text-muted-foreground hover:text-foreground transition">Payment</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="outline" className="hidden sm:block bg-transparent">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary-dark">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block mb-6 px-3 py-1 bg-secondary text-muted-foreground text-sm rounded-full border border-border">
            🔔 Stop Silent Failures
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 text-balance leading-tight">
            If it didn't run, <span className="text-primary">we tell you</span>. If it failed, <span className="text-primary">we remember</span>.
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
            Heartbeat monitoring for your critical jobs. But unlike traditional monitoring, StillUp learns from failures and prevents them from happening again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-12 border-t border-border">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">10K+</div>
              <p className="text-sm text-muted-foreground">Heartbeats/month</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">99.99%</div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">&lt;100ms</div>
              <p className="text-sm text-muted-foreground">Response time</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 text-balance">
                Your critical jobs are failing silently
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Database backups run "successfully" for months without actually working. SSL certificates expire. Sync jobs break with no alerts. You discover the disaster when disaster strikes.
              </p>
              
              <ul className="space-y-4">
                {['Disk full errors ignored', 'Permission changes cause silent failures', 'Network timeouts aren\'t logged', 'Expired credentials go unnoticed', 'You only find out when restoring'].map((issue) => (
                  <li key={issue} className="flex items-center gap-3 text-foreground">
                    <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-secondary rounded-xl p-8 border border-border">
              <div className="font-mono text-sm text-muted-foreground">
                <div className="text-primary mb-4">$ cat backup-db.sh</div>
                <div className="space-y-2">
                  <div>#!/bin/bash</div>
                  <div className="text-foreground"># Run your backup</div>
                  <div>/usr/local/bin/backup-db.sh</div>
                  <div className="text-muted-foreground"># ✅ Exits with code 0</div>
                  <div className="text-muted-foreground"># ❌ Database completely corrupted</div>
                  <div className="text-muted-foreground"># ❌ No one is alerted</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Smart Monitoring with Memory
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              StillUp goes beyond simple alerts. It learns from failures and helps you prevent them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Simple Integration',
                description: 'One curl command. No agents, no complex setup. Works anywhere curl works.'
              },
              {
                icon: Brain,
                title: 'Pattern Detection',
                description: 'Learns your failure patterns: "This job always fails on Mondays at 2 AM"'
              },
              {
                icon: BarChart3,
                title: 'Deep Analytics',
                description: 'Uptime trends, health scores, and failure distribution across all monitors.'
              },
              {
                icon: Clock,
                title: 'Execution Memory',
                description: 'Remembers every failure: what went wrong, how it was fixed, and when.'
              },
              {
                icon: AlertCircle,
                title: 'Smart Alerts',
                description: 'Email, webhooks, Slack, Discord, PagerDuty integrations. Never miss an issue.'
              },
              {
                icon: Lock,
                title: 'Secure & Private',
                description: 'HTTPS encryption, hashed API keys, and strict data isolation by default.'
              }
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-secondary rounded-xl p-8 border border-border hover:border-primary/50 transition">
                  <Icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="compare" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How StillUp Is Different
            </h2>
            <p className="text-lg text-muted-foreground">
              Traditional monitoring tells you what failed. StillUp prevents failures from happening again.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Healthchecks.io</th>
                  <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Uptime Kuma</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary">StillUp</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Basic Heartbeat Monitoring', true, true, true],
                  ['Email Alerts', true, true, true],
                  ['Webhook Integrations', true, true, true],
                  ['Failure Memory', false, false, true],
                  ['Pattern Detection', false, false, true],
                  ['Resolution Tracking', false, false, true],
                  ['Learning & Insights', false, false, true],
                  ['Health Scores', false, false, true]
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-border hover:bg-secondary/30 transition">
                    <td className="py-4 px-4 text-foreground font-medium">{row[0]}</td>
                    <td className="text-center py-4 px-4">
                      {row[1] ? <CheckCircle className="w-5 h-5 text-primary mx-auto" /> : <div className="text-muted-foreground">—</div>}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row[2] ? <CheckCircle className="w-5 h-5 text-primary mx-auto" /> : <div className="text-muted-foreground">—</div>}
                    </td>
                    <td className="text-center py-4 px-4">
                      {row[3] ? <CheckCircle className="w-5 h-5 text-accent mx-auto" /> : <div className="text-muted-foreground">—</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Built for Any Scheduled Job
            </h2>
            <p className="text-lg text-muted-foreground">
              Monitor everything that needs to run reliably
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Database Backups',
                description: 'Ensure your backups complete successfully every time. Get alerted immediately if something goes wrong.'
              },
              {
                title: 'SSL Certificate Renewal',
                description: 'Never let an SSL certificate expire again. Monitor certbot or any renewal script automatically.'
              },
              {
                title: 'Data Sync Jobs',
                description: 'Keep your data in sync across systems. Catch sync failures before they cascade.'
              },
              {
                title: 'Health Checks',
                description: 'Verify critical services are responsive. Get alerts when services become unhealthy.'
              },
              {
                title: 'Report Generation',
                description: 'Ensure scheduled reports always complete and reach stakeholders on time.'
              },
              {
                title: 'Cleanup & Maintenance',
                description: 'Monitor disk cleanup, log rotation, and other maintenance tasks silently.'
              }
            ].map((useCase) => (
              <div key={useCase.title} className="bg-secondary rounded-xl p-8 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-12 text-center">
            Get Started in 2 Minutes
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Create a Monitor</h3>
                <p className="text-muted-foreground mb-3">Set up your monitor with a schedule and grace period</p>
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm text-muted-foreground border border-border">
                  curl https://stillup.io/hb/your-token
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Add to Your Script</h3>
                <p className="text-muted-foreground mb-3">Send a heartbeat when your job completes successfully</p>
                <div className="bg-secondary rounded-lg p-4 font-mono text-sm text-muted-foreground border border-border overflow-x-auto">
                  <div>/usr/local/bin/backup.sh</div>
                  <div>curl https://stillup.io/hb/token</div>
                </div>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Get Alerted</h3>
                <p className="text-muted-foreground">Receive instant notifications when heartbeats are missed or failures occur</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2">
              Create Your First Monitor <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free. Scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['3 monitors', '1,000 heartbeats/month', 'Email alerts', '30-day history', 'Basic analytics']
              },
              {
                name: 'Starter',
                price: '$9',
                period: '/month',
                features: ['25 monitors', '50,000 heartbeats/month', 'Email + Webhook alerts', '90-day history', 'Pattern detection', 'Full analytics'],
                highlighted: true
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                features: ['Unlimited monitors', 'Unlimited heartbeats', 'All alert channels', 'Unlimited history', 'Advanced analytics', 'Priority support']
              }
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-8 ${plan.highlighted ? 'bg-secondary border-primary' : 'bg-secondary border-border'}`}>
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-foreground">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.price === '$0' ? '/auth/signup' : '/payment'} className="w-full">
                  <Button className={`w-full ${plan.highlighted ? 'bg-primary hover:bg-primary-dark text-primary-foreground' : ''}`} variant={plan.highlighted ? 'default' : 'outline'}>
                    {plan.price === '$0' ? 'Get Started' : 'Upgrade'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto text-center bg-secondary rounded-xl p-12 border border-border">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Stop Silent Failures Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join developers who've already caught critical failures before they became disasters.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground gap-2">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">●</span>
                </div>
                <span className="font-bold text-foreground">StillUp</span>
              </div>
              <p className="text-muted-foreground text-sm">Heartbeat monitoring with memory.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 StillUp. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Privacy</Link>
              <Link href="#" className="hover:text-foreground transition">Terms</Link>
              <Link href="#" className="hover:text-foreground transition">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
