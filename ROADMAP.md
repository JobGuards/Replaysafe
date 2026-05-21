# Replaysafe Strategic Roadmap

**Vision**: The safety layer for autonomous infrastructure.  
**Focus**: "Replay-safe infrastructure for autonomous systems."

Replaysafe provides the "Safety Primitives" that prevent autonomous agents and background jobs from causing destructive side effects during retries or failures.

---

## 🟢 Phase 1: The Safety Foundation (Completed)
*The core engine for replay-safe execution and side-effect deduplication.*

- [x] **ReplayGuard Core Engine**: Decision engine to determine `EXECUTE` vs `SKIP` for side effects.
- [x] **Action Fingerprinting**: Deterministic hashing of job inputs, targets, and types.
- [x] **Replay-Safe Deduplication**: Prevents duplicate Stripe charges, double emails, and redundant DB writes using cryptographic execution fingerprinting.
- [x] **ReplayGuard SDK (@replaysafe/guard-sdk)**: TypeScript SDK for wrapping fetch, AI calls, and generic functions.
- [x] **Execution Tracing (Visual Timeline)**: High-fidelity audit trail showing "Skipped" vs "Executed" operations.
- [x] **Heartbeat Sentinel**: Base infrastructure for monitoring "Silent Failures" in background jobs.
- [x] **API Key Security**: Hardened project-scoped keys for CLI and SDK authentication.

---

## 🟢 Phase 2: Agent-Centric Safety (COMPLETED)
*Deepening support for AI Agents and non-deterministic autonomous systems.*

- [x] **AI Action Verification**: Specialized `.ai()` wrapper to protect high-cost LLM generations.
- [x] **Webhook Safety Layer**: Automatic idempotency headers and replay protection for outbound webhooks.
- [x] **State Fingerprinting**: Ability to snapshot infrastructure state before/after actions to detect drift.
- [x] **Deduplication Engine**: Global cross-project deduplication for identical jobs triggered by agents.
- [x] **Multi-Attempt History**: Aggregated view of a job's life across N failures and M recoveries.

---

## 🟢 Phase 3: Operational Memory & Rollbacks (COMPLETED)
*Moving from "Don't Repeat" to "Know How to Revert".*

- [x] **Rollback-Aware Execution**: Integrated logic to trigger cleanup/undo actions if a job fails mid-run (`guard.compensate()`).
- [x] **Webhook Hub**: Centralized visibility for outbound communications and side-effect deduplication.
- [x] **Safety ROI Dashboard**: Visual analytics for "Dangerous Retries" blocked and financial savings.
- [x] **Tunnelight Handshake Audits**: Deep telemetry for WireGuard/VPN tunnels to detect "Ghost Connections."
- [x] **Secret Rotation Sentinels**: Automatic alerts for expiring certificates and stale keys detected in job telemetry.
- [x] **Jitter & Network Degradation**: Pattern detection for unstable pipes via statistical deviation alerts.

---

## 🟢 Phase 4: Sovereign Infrastructure (Self-Hoster Ready) - COMPLETED
*Optimizing for privacy-first, local-only, and consumer-hardware deployments.*

- [x] **Homelab Use-Case Suite**: Dedicated documentation for Home Assistant, Media Scraping, and Local AI.
- [x] **Privacy-First "Sovereign" Mode**: Ensure 100% offline functionality with zero external telemetry.
- [x] **One-Click Docker Stack**: Unified `docker-compose.yml` for instant local deployment.
- [x] **Consumer Hardware Optimization**: Performance tuning for Raspberry Pi and low-resource mini-PCs.
- [x] **Local-First CLI Flow**: Prioritize custom instance URLs in CLI documentation and authentication.
- [x] **"Sovereign" UI Identity**: Aesthetic adjustments to emphasize local ownership over SaaS dependence.

---

## 🟢 Phase 5: Autonomous Sentinel Hub (COMPLETED)
*The centralized control plane for autonomous reliability.*

- [x] **Memory-Aware Status Pages**: Public pages that show not just "Up/Down", but "Retry Safety" and "Rollback Health."
- [x] **AI-Driven Pattern Discovery**: Automatically identifying "Cascading Failures" where one job retry breaks another.
- [x] **Global Sentinel Tunnels**: Multi-region secure tunnels to monitor latency and handshake health globally.
- [x] **Self-Healing Webhooks**: Automatic resolution of "Silent Failures" by re-triggering jobs through ReplayGuard.

---

## Current Status Summary

| Feature | Category | Status |
| :--- | :--- | :--- |
| Replay-safe execution | Safety Primitive | ✅ COMPLETED |
| Action Fingerprinting | Safety Primitive | ✅ COMPLETED |
| Execution Tracing | Safety Primitive | ✅ COMPLETED |
| ReplayGuard SDK | Safety Primitive | ✅ COMPLETED |
| AI Agent Retry Protection | Agent Safety | ✅ COMPLETED |
| Webhook Safety | Agent Safety | ✅ COMPLETED |
| Rollback Engine | Infrastructure Memory | ✅ COMPLETED |
| Operational Memory | Infrastructure Memory | ✅ COMPLETED |
| Tunnelight Engine | Telemetry | ✅ COMPLETED |
| Sovereign Infrastructure | Self-Hosting | ✅ COMPLETED |
| Autonomous Sentinel Hub | Intelligence | ✅ COMPLETED |
