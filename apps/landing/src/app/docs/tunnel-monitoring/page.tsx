"use client";

import React from "react";
import { DocLayout } from "@/components/docs/DocLayout";
import { Lock, Wifi, ShieldAlert, Zap } from "lucide-react";

export default function TunnelMonitoringDoc() {
  return (
    <DocLayout
      title="Tunnel Monitoring"
      subtitle="Infrastructure Sentinel"
      category="Infrastructure"
    >
      <div className="space-y-16">
        <p className="text-xl leading-relaxed">
          The **Tunnelight Engine** enables high-fidelity monitoring of
          encrypted network tunnels, including WireGuard, SSH, and OpenVPN.
        </p>

        <section className="glass-panel border border-border/10 rounded-[3rem] p-12 bg-acid-lime/[0.02]">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-8 text-foreground italic flex items-center gap-4">
            <Lock className="text-acid-lime w-6 h-6" /> The Silent Failure
            Problem
          </h3>
          <p className="leading-relaxed text-muted-foreground mb-8">
            Network tunnels often fail "silently"—the process remains active,
            but data flow is obstructed due to stale handshakes or routing
            loops. Replaysafe Sentinel monitors the **Pulse** of the tunnel, not
            just the process status.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureBox
              icon={<Wifi className="w-5 h-5" />}
              title="Handshake Telemetry"
              desc="Real-time tracking of the last successful cryptographic handshake."
            />
            <FeatureBox
              icon={<Zap className="w-5 h-5" />}
              title="Latency Pulses"
              desc="Millisecond-precision tracking of network RTT within the tunnel."
            />
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Configuration
          </h2>
          <p className="text-muted-foreground">
            To monitor a tunnel, you must provide the sentinel with your
            tunnel's public endpoint and the expected handshake threshold.
          </p>
          <div className="bg-foreground/[0.02] p-8 rounded-[2.5rem] border border-border/10 font-mono text-sm space-y-4">
            <div className="text-acid-lime">
              # Example: Monitoring a WireGuard Tunnel
            </div>
            <div className="text-foreground/60">
              Replaysafe monitor add \<br />
              &nbsp;&nbsp;--type tunnel \<br />
              &nbsp;&nbsp;--name "HQ-Office-VPN" \<br />
              &nbsp;&nbsp;--endpoint "vpn.hq.example.com:51820" \<br />
              &nbsp;&nbsp;--threshold 180s
            </div>
          </div>
        </section>

        <section className="space-y-6 pt-12 border-t border-border/5">
          <h2 className="text-4xl font-black uppercase tracking-tight text-foreground italic">
            Alerting Thresholds
          </h2>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-acid-lime mt-2"></div>
              <div>
                <strong className="text-foreground">Degraded State:</strong>{" "}
                Triggered when latency exceeds 200ms or handshake age exceeds 3
                minutes.
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-destructive mt-2"></div>
              <div>
                <strong className="text-foreground">Down State:</strong>{" "}
                Triggered when no handshake is detected for more than 5 minutes.
              </div>
            </li>
          </ul>
        </section>
      </div>
    </DocLayout>
  );
}

function FeatureBox({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-acid-lime">{icon}</div>
        <h4 className="font-black uppercase tracking-tight text-sm">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
