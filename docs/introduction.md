# Introduction to StillUp

StillUp is an industry-leading, enterprise-grade heartbeat monitoring platform designed for modern, distributed infrastructure. It provides more than just "uptime checks"—it offers deep intelligence into your system's stability, failure patterns, and security posture.

## Why StillUp?

In a world of microservices and complex cloud environments, traditional monitoring often falls short. StillUp was built to solve the "Silent Failure" problem: services that are "technically up" but functionally unstable.

### Key Pillars

1. **Intelligent Monitoring**: Beyond binary status checks. StillUp calculates real-time **Health Scores** and detects **Recurring Failure Patterns** using historical data analysis.
2. **ReplayGuard™ (Safe Retries)**: The first safety layer for background jobs. StillUp ensures that retrying a failed job is always safe by preventing duplicate side effects like double payments or duplicate emails.
3. **Security-First Architecture**: Built with security at the core. 
    - **HMAC Signing**: All job sessions are cryptographically signed to prevent spoofing.
    - **Encryption**: Field-level AES-256-GCM encryption for all secrets at rest.
    - **Audit Logs**: Comprehensive tracking of every sensitive action.
4. **Premium UX**: A dashboard designed for clarity and speed. Glassmorphic UI, real-time heartbeat pulses, and rich notification integrations with Slack and Discord.

## How it Works

StillUp operates on a **Heartbeat Push** model. Instead of us polling your service (which often fails due to firewalls or complex auth), your service "pushes" a heartbeat to us.

- **The Heartbeat**: A simple POST request to our API.
- **The Intelligence**: Our background workers process every heartbeat to update health scores, detect patterns, and aggregate 24-hour pulse data.
- **The Alert**: If a heartbeat is missed beyond your defined grace period, StillUp triggers rich notifications across your configured channels.

## Roadmap

StillUp is evolving rapidly. Our current roadmap includes:
- [x] Phase 1: Security Hardening (RBAC, Audit Logs, Encryption)
- [x] Phase 2: Intelligence UI & Alerting (Health Scores, Pattern Detection)
- [x] Phase 3: ReplayGuard™ (Exactly-Once Job Retries & SDK)
- [x] Phase 4: Sentinel CLI (Production-ready Node CLI & Tunnelight Engine)
- [/] Phase 5: Launch Prep (Stripe, Public Status Pages, Documentation)

---

StillUp is more than a monitor—it's your system's insurance policy.
