<div align="center">
<img width="150" height="160" alt="silluplogo" src="https://github.com/user-attachments/assets/7bf8e426-9649-4df6-a4c3-2269ebae02b1" />

  <h1>STILLUP</h1>
  <p><strong>The Safety Layer for Autonomous Systems & AI Agents</strong></p>
  
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-acidlime.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue.svg)]()
  [![Status](https://img.shields.io/badge/status-production--ready-green.svg)]()
</div>

---

## ⚡ Reliability for the AI Era

StillUp is the world's first **Replay-Safe Infrastructure** platform. While traditional monitors tell you when something is down, StillUp ensures that **retrying failed systems is always safe.** 

Built specifically for the reliability problems created by autonomous agents and complex background jobs, StillUp provides the "Safety Primitives" needed to prevent duplicate side effects, redundant charges, and cascading infrastructure failures.

### ✨ The "Sharp Wedge" Features

- 🛡️ **ReplayGuard™ (Exactly-Once Execution)**: The first safety layer for AI Agents and background jobs. Prevent duplicate side effects (double payments, double emails, redundant API calls) during retries with cryptographic fingerprinting.
- 🛰️ **Infrastructure Memory**: StillUp tracks every side effect, handshake, and heartbeat. It provides a "Decision Engine" for your jobs: *Has this already happened? Should I skip it?*
- 🤖 **AI Agent Retry Protection**: Dedicated SDK wrappers to protect high-cost LLM generations and agentic actions from non-deterministic failures.
- 🛠️ **Automated Rollbacks**: Register compensation hooks (`onRollback`) that trigger automatically when jobs fail, ensuring state consistency across complex autonomous runs.
- 💹 **Safety ROI Dashboard**: Visualize the value of blocked dangerous retries, estimated engineer hours saved, and real-time project health scores.
- 🌐 **Webhook Hub**: Centralized visibility for all outbound communications, ensuring idempotency and security for your integration layer.
- 🎨 **Sentinel Hub UI**: A premium, glassmorphic command center to visualize your "Execution Memory" and infrastructure health.

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
