# StillUp Strategic Roadmap

**Vision**: The safety layer for autonomous infrastructure.  
**Focus**: "Replay-safe infrastructure for autonomous systems."

StillUp provides the "Safety Primitives" that prevent autonomous agents and background jobs from causing destructive side effects during retries or failures.

---

## 🟢 Phase 1: The Safety Foundation (Completed)
*The core engine for exactly-once execution and reliability.*

- [x] **ReplayGuard™ Core Engine**: Decision engine to determine `EXECUTE` vs `SKIP` for side effects.
- [x] **Action Fingerprinting**: Deterministic hashing of job inputs, targets, and types.
- [x] **Exactly-Once Semantics**: Prevents duplicate Stripe charges, double emails, and redundant DB writes.
- [x] **ReplayGuard SDK (@stillup/guard-sdk)**: TypeScript SDK for wrapping fetch, AI calls, and generic functions.
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

## 🔵 Phase 3: Operational Memory & Rollbacks (Upcoming)
*Moving from "Don't Repeat" to "Know How to Revert".*

- [ ] **Rollback-Aware Execution**: Integrated logic to trigger cleanup/undo actions if a job fails mid-run.
- [ ] **Operational Memory Graph**: Visualization of how different jobs and side effects are connected.
- [/] **Tunnelight Handshake Audits**: Deep telemetry for WireGuard/VPN tunnels to detect "Ghost Connections."
- [ ] **Secret Rotation Sentinels**: Automatic alerts for expiring certificates and stale keys detected in job telemetry.
- [ ] **Jitter & Network Degradation**: Pattern detection for unstable pipes before they fully disconnect.

---

## 🟣 Phase 4: Autonomous Sentinel Hub (Future)
*The centralized control plane for autonomous reliability.*

- [ ] **Memory-Aware Status Pages**: Public pages that show not just "Up/Down", but "Retry Safety" and "Rollback Health."
- [ ] **AI-Driven Pattern Discovery**: Automatically identifying "Cascading Failures" where one job retry breaks another.
- [ ] **Global Sentinel Tunnels**: Multi-region secure tunnels to monitor latency and handshake health globally.
- [ ] **Self-Healing Webhooks**: Automatic resolution of "Silent Failures" by re-triggering jobs through ReplayGuard.

---

## Current Status Summary

| Feature | Category | Status |
| :--- | :--- | :--- |
| Exactly-once execution | Safety Primitive | ✅ COMPLETED |
| Action Fingerprinting | Safety Primitive | ✅ COMPLETED |
| Execution Tracing | Safety Primitive | ✅ COMPLETED |
| ReplayGuard SDK | Safety Primitive | ✅ COMPLETED |
| AI Agent Retry Protection | Agent Safety | ✅ COMPLETED |
| Webhook Safety | Agent Safety | ✅ COMPLETED |
| Rollback Engine | Infrastructure Memory | 📅 UPCOMING |
| Operational Memory Graph | Infrastructure Memory | 📅 UPCOMING |
| Tunnelight Engine | Telemetry | 🚧 IN PROGRESS |
