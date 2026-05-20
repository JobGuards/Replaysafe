# Introduction to StillUp

StillUp is the industry's first **Replay-Safe Execution Layer** for AI agents, background jobs, and complex autonomous systems. It ensures that retrying a failed task is always safe, preventing duplicate side effects like double payments, redundant emails, or corrupted database state.

## Why StillUp?

In modern distributed systems—especially those driven by AI agents or non-deterministic workflows—failures are inevitable. When an agent fails mid-task and retries, it often re-executes actions that already succeeded.

StillUp solves the **"Dangerous Retry"** problem by providing replay-safe execution and side-effect deduplication across your infrastructure.

### Key Pillars

1. **ReplayGuard™ (Replay-Safe Execution)**: The core safety engine. ReplayGuard tracks side effects using cryptographic fingerprints. If a job retries, StillUp intercepts duplicate actions and replays the original successful result instead.
2. **Execution Memory**: StillUp remembers every side effect, API call, and state change your agents make. It acts as a shared brain for your infrastructure, ensuring idempotency even for third-party APIs that don't support it natively.
3. **Infrastructure Telemetry**: Visibility for the replay engine. We monitor the health of the underlying services your agents depend on (Crons, VPN Tunnels, Webhooks) so you know when infrastructure degrades before a retry turns into a disaster.
4. **Security-First Architecture**: Built with security at the core. 
    - **HMAC Signing**: All job sessions are cryptographically signed.
    - **Encryption**: Field-level AES-256-GCM encryption for all secrets at rest.
    - **Audit Logs**: Comprehensive tracking of every sensitive action.

## How it Works

StillUp operates as a lightweight wrapper around your existing functions or as a standalone CLI for infrastructure telemetry.

- **The Fingerprint**: Wrap your dangerous side effects (e.g., `chargeCustomer()`). StillUp generates a unique fingerprint based on the inputs and execution context.
- **The Interception**: Before executing, StillUp checks its Execution Memory. If the fingerprint exists, it skips execution and returns the cached result.
- **The Telemetry**: Use our CLI (`stillup hb`) to pulse health metrics from any cron or secure tunnel, ensuring the environment is healthy before agents operate.

## Roadmap

StillUp is evolving rapidly. Our current roadmap includes:
- [x] Phase 1: Security Hardening (RBAC, Audit Logs, Encryption)
- [x] Phase 2: Intelligence UI & Alerting (Health Scores, Pattern Detection)
- [x] Phase 3: ReplayGuard™ (Replay-Safe Job Retries & SDK)
- [x] Phase 4: Sentinel CLI (Production-ready Node CLI & Tunnelight Engine)
- [/] Phase 5: Launch Prep (Stripe, Public Status Pages, Documentation)

---

StillUp is more than a monitor—it's execution safety for the autonomous era.
