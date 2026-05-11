<div align="center">
  <img src="https://raw.githubusercontent.com/stillup/brand/main/logo.png" alt="StillUp Logo" width="200" />
  <h1>STILLUP</h1>
  <p><strong>The High-Fidelity Infrastructure Sentinel & Job Reliability Platform</strong></p>
  
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-acidlime.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue.svg)]()
  [![Status](https://img.shields.io/badge/status-production--ready-green.svg)]()
</div>

---

## ⚡ The Monitor That Thinks

StillUp is more than an uptime checker. It's a security-hardened **Reliability Platform** that combines **Infrastructure Safety** (Secure Tunnels, Crons, Backups) with **Job Safety** (ReplayGuard™). Built for engineers who demand exactly-once semantics, real-time observability, and a premium visual experience.

### ✨ Key Features

- 🛡️ **ReplayGuard™ (Safe Retries)**: The first safety layer for background jobs. Prevent duplicate side effects (double payments, double emails) during job retries with cryptographic fingerprinting.
- 🛰️ **Secure Tunnel Monitoring**: Real-time handshake tracking and latency metrics for encrypted networks (WireGuard, SSH). Detect silent failures before they break your access.
- 🧠 **Cryptographic Memory**: We track every side effect, handshake, and heartbeat. Identify trends in network degradation and past resolution patterns.
- 💻 **Global CLI**: A powerful Node-based CLI for heartbeat ingestion, tunnel monitoring, and job guarding from any terminal or CI/CD pipeline.
- 🔐 **Hardened Security Vault**: Enterprise-grade RBAC, Audit Logging, and AES-256-GCM secret encryption at rest.
- 🎨 **Sentinel Hub UI**: A premium, glassmorphic command center with a dynamic 'Control Center' grid and acid-lime aesthetics.

## 💻 StillUp CLI

The StillUp CLI is the easiest way to monitor your infrastructure from the terminal.

```bash
# Install globally (once published)
npm install -g @stillup/cli

# Login to your project
stillup login YOUR_API_KEY

# Pulse a heartbeat
stillup hb your-monitor-token

# Monitor a secure tunnel (Tunnelight Engine)
stillup tunnel monitor your-tunnel-token --target 8.8.8.8
```

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-org/stillup.git
cd stillup
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Set your DATABASE_URL and MASTER_ENCRYPTION_KEY
```

### 3. Initialize Database
```bash
pnpm db:push
pnpm db:generate
```

### 4. Launch Intelligence
```bash
pnpm run dev
```
Visit `http://localhost:3000` to access the dashboard.

## 🛡️ Security Architecture

StillUp is designed with a "Secure by Default" philosophy:
- **Zero Plaintext Secrets**: Webhook URLs and tokens are encrypted with industry-standard AES-256-GCM.
- **Role-Based Access**: Granular control over who can modify your infrastructure.
- **Audit Trails**: Every login, deletion, and configuration change is logged for compliance.

## 📖 Documentation

Explore our full documentation suite in the [`/docs`](./docs) directory:
- [Introduction](./docs/introduction.md)
- [Architecture & Security](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

## ⚖️ License

StillUp is open-source software licensed under the [AGPL-3.0 License](LICENSE).

---

<div align="center">
  <p>Built with ❤️ by the StillUp Team</p>
  <p><i>"Because sleeping well starts with knowing everything is still up."</i></p>
</div>