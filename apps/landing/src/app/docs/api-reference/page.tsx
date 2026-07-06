"use client";

import React from "react";
import { Terminal, Code2, Globe, Key } from "lucide-react";
import { DocLayout } from "@/components/docs/DocLayout";

export default function APIReferenceDoc() {
  return (
    <DocLayout title="API Reference" subtitle="Developers" category="Reference">
      <div className="space-y-16">
        <p className="text-xl leading-relaxed">
          Robust, secure, and developer-friendly endpoints for infrastructure
          monitoring.
        </p>

        <section className="space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Authentication
          </h2>
          <p className="leading-relaxed">
            All API requests must include your monitor or project API Key in the{" "}
            <code className="text-acid-lime font-bold">X-API-Key</code> header.
          </p>
          <div className="p-6 bg-card rounded-2xl border border-border/10 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Example Curl
            </p>
            <code className="text-xs font-mono text-foreground block">{`curl -H "X-API-Key: YOUR_API_KEY" ${(process.env.NEXT_PUBLIC_API_URL || "https://api.your-domain.com").replace(/\/api$/, "")}/api/v1/...`}</code>
          </div>
        </section>

        <section className="space-y-12 pt-12 border-t border-border/10">
          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Endpoints
          </h2>

          <div className="space-y-12">
            {/* Heartbeat */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-acid-lime text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg">
                  POST
                </span>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  /api/heartbeats
                </h3>
              </div>
              <p className="leading-relaxed">
                Updates the status of the monitor associated with the API key.
                Triggers incident recovery if the monitor was previously down.
              </p>
              <div className="p-6 bg-foreground/5 rounded-2xl space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Request Body (Optional)
                </p>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                  {`{
  "status": "success",
  "metadata": {
    "server": "us-east-1",
    "version": "1.0.4"
  }
}`}
                </pre>
              </div>
            </div>

            {/* Sentinel Telemetry */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-acid-lime text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-lg">
                  POST
                </span>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  /api/sentinel/telemetry
                </h3>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                High-fidelity endpoint for infrastructure telemetry. Used by the
                Sentinel CLI to report secure tunnel health, network latency,
                and cryptographic handshake age.
              </p>
              <div className="p-6 bg-foreground/[0.03] rounded-2xl border border-border/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Request Body
                </p>
                <pre className="text-xs font-mono text-acid-lime whitespace-pre-wrap">
                  {`{
  "type": "TUNNEL",
  "metrics": {
    "handshakeAge": 124,  // in seconds
    "latency": 18.5,       // in milliseconds
    "peerCount": 1
  },
  "config": {
    "publicKey": "base64_string...",
    "endpoint": "vpn.example.com"
  }
}`}
                </pre>
              </div>
            </div>

            {/* Intelligence */}
            <div className="space-y-4 pt-8 border-t border-border/5">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-foreground/[0.05] text-foreground/60 text-[10px] font-black uppercase tracking-widest rounded-lg">
                  GET
                </span>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                  /api/analytics/overview
                </h3>
              </div>
              <p className="leading-relaxed text-muted-foreground">
                Returns aggregated health scores, uptime trends, and active
                failure patterns for all infrastructure sentinels.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
