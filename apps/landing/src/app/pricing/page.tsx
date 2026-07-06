"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Check,
  Shield,
  Zap,
  Globe,
  Cpu,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";

import { InterestForm } from "@/components/InterestForm";

export default function PricingPage() {
  const plans = [
    {
      name: "Self-Hosted",
      price: "$0",
      description: "The core Replaysafe engine. Free forever.",
      features: [
        "Unlimited Heartbeat Monitors",
        "Unlimited Guarded Sessions",
        "Your Own Database & Infrastructure",
        "Full Source Code Access",
        "Community Support",
        "No Data Retention Limits",
      ],
      cta: "View GitHub",
      highlight: false,
    },
    {
      name: "Cloud Pro",
      price: "$29",
      description: "Managed Replaysafe Cloud for teams.",
      features: [
        "Up to 50 Managed Monitors",
        "Global Edge Distribution",
        "Replay-Safe Retries",
        "30 Second High-Res Checks",
        "90 Day Managed Retention",
        "Slack & Discord Integrations",
        "No Infrastructure Maintenance",
      ],
      cta: "Start 14-Day Trial",
      highlight: true,
    },
    {
      name: "Cloud Enterprise",
      price: "Custom",
      description: "The complete Sentinel suite, managed.",
      features: [
        "Unlimited Managed Monitors",
        "Side-Effect Auditing",
        "Key & Certificate Safety",
        "Real-time Telemetry",
        "Custom Secret Rotation",
        "White-label Portal",
        "Dedicated 24/7 Support",
      ],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background bg-tech-grid p-6 sm:p-24 selection:bg-acid-lime selection:text-primary-foreground relative overflow-hidden font-inter">
      {/* Background Glow */}
      <div className="radial-glow-hero opacity-30 pointer-events-none"></div>

      <header className="fixed top-0 left-0 w-full h-24 px-12 flex items-center justify-between z-50 backdrop-blur-md border-b border-border/5">
        <Logo />
        <ModeToggle />
      </header>

      <div className="max-w-[1400px] mx-auto space-y-32 pt-20">
        {/* Header */}
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-acid-lime/5 border border-acid-lime/20 shadow-[0_0_20px_rgba(var(--theme-lime-rgb),0.1)]">
            <Shield className="w-4 h-4 text-acid-lime" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-acid-lime italic">
              Pricing_Protocol: Alpha
            </span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.85]">
            Scale your <br /> <span className="glow-lime">Reliability</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium opacity-80">
            Deploy the Sentinel that fits your scale. From basic crons to global
            encrypted tunnel networks and <b>idempotent background jobs</b>.
          </p>
        </div>

        {/* Pricing Grid */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass-panel border-border/10 rounded-[3.5rem] p-12 flex flex-col transition-all duration-700 hover:-translate-y-4 group relative overflow-hidden ${
                plan.highlight
                  ? 'border-acid-lime/30 shadow-2xl shadow-acid-lime/5 bg-acid-lime/[0.03]'
                  : 'hover:border-acid-lime/20 bg-card/20'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-8 right-8 bg-acid-lime text-primary-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Popular
                </div>
              )}
              
              <div className="space-y-6 mb-12">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{plan.name}</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black tracking-tighter text-foreground">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-muted-foreground font-bold text-xl">/mo</span>}
                </div>
                <p className="text-muted-foreground font-medium leading-relaxed">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-6 mb-16">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-4 group/item">
                    <div className="flex-shrink-0 w-6 h-6 rounded-xl bg-acid-lime/10 flex items-center justify-center border border-acid-lime/20 group-hover/item:bg-acid-lime group-hover/item:border-acid-lime transition-all duration-300">
                      <Check className="w-3.5 h-3.5 text-acid-lime group-hover/item:text-primary-foreground" />
                    </div>
                    <span className="text-sm font-bold text-foreground/80 group-hover/item:text-foreground transition-colors">{feature}</span>
                  </div>
                ))}
              </div>

              <Link 
                href={
                  plan.name === 'Self-Hosted' ? 'https://github.com/Replaysafe/Replaysafe' : 
                  plan.name === 'Cloud Pro' ? '/payment?plan=pro' : 
                  'mailto:sales@Replaysafe.io'
                }
                className="w-full"
              >
                <Button
                  className={`w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 transform active:scale-95 ${
                    plan.highlight
                      ? 'bg-acid-lime text-primary-foreground hover:shadow-2xl hover:shadow-acid-lime/40'
                      : 'bg-foreground text-background hover:opacity-90'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div> */}

        {/* Community First Notice */}
        <div className="glass-panel border-acid-lime/20 bg-acid-lime/[0.02] rounded-[3rem] p-12 text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-acid-lime/10 border border-acid-lime/20">
            <Cpu className="w-3.5 h-3.5 text-acid-lime" />
            <span className="text-[9px] font-black uppercase tracking-widest text-acid-lime italic">
              Community_First_Protocol
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight italic">
            Focused on Open Source.
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Replaysafe is currently focused on empowering the developer
            community through our <b>OSS Version</b>. While we plan to offer
            managed Cloud plans in the future, our expansion into global
            infrastructure and specialized Cloud support will be
            <b> 100% driven by community demand</b>.
          </p>

          <div className="mx-auto pt-4">
            <InterestForm />
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="https://github.com/JobGuards/Replaysafe/issues">
              <Button
                variant="outline"
                className="rounded-full border-border/20 text-xs font-bold uppercase tracking-widest px-8"
              >
                Join the Discussion
              </Button>
            </Link>
          </div>
        </div>

        {/* trust Section */}
        <div className="pt-32 border-t border-border/5 grid grid-cols-1 md:grid-cols-3 gap-20 text-center md:text-left">
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10 group-hover:scale-110 transition-transform duration-500">
              <Lock className="w-8 h-8 text-acid-lime" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic">
              Secure Telemetry
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Every sentinel communication is protected with enterprise-grade
              encryption. We never intercept or store your private traffic.
            </p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10 group-hover:scale-110 transition-transform duration-500">
              <ShieldAlert className="w-8 h-8 text-acid-lime" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic">
              Silent Failure Alerts
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Detect network degradation and stale handshakes before your users
              do. Replaysafe is the first to know when pipes go dry.
            </p>
          </div>
          <div className="space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-acid-lime/5 flex items-center justify-center border border-acid-lime/10 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-8 h-8 text-acid-lime" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic">
              Instant Response
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Our edge-native engine triggers alerts in milliseconds across
              Slack, PagerDuty, and custom webhooks for immediate recovery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
