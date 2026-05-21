<div align="center">
<img width="150" height="160" alt="stilluplogo" src="https://github.com/user-attachments/assets/7bf8e426-9649-4df6-a4c3-2269ebae02b1" />

  <h1>STILLUP</h1>
  <p><strong>Replay-safe retries for async jobs and AI-agent workflows.</strong></p>
  
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-acidlime.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue.svg)]()
</div>

---

StillUp is a **lightweight, privacy-first safety layer** that prevents duplicate side effects (like double charges, duplicate emails, and redundant API calls) during job retries and non-deterministic agent workflows.

## 🔴 The Pain: Retry Amplification
When background jobs, queues, or AI agents fail mid-execution and retry:
1. **Duplicate Processing**: A job crashes *after* charging a customer card but *before* updating the database. On retry, it charges the card again.
2. **Cascading Load / Hammering**: Upstream retries hit downstream databases aggressively, causing cascading failures and resource exhaustion.
3. **Transient Payload Drift**: Payload hashes change on retries due to random UUIDs, timestamps, or trace IDs, breaking basic idempotency checks.

---

## 🟢 The Primitive: ReplayGuard
StillUp wraps your non-idempotent side effects with **ReplayGuard™**. It creates deterministic execution fingerprints of your operations, caches successful executions, and automatically returns the original result on subsequent retries.

### Guarantees
- **Replay-safe retries**
- **Deduplication**
- **Stable execution fingerprints**

### Example: Stripe Double-Charge Prevention

```typescript
import { withReplayGuard } from '@stillup/guard-sdk';

const config = {
  apiKey: process.env.STILLUP_API_KEY,
  monitorId: 'your-monitor-id',
};

await withReplayGuard(config, async (guard) => {
  // 1. Guard a non-idempotent operation (e.g., Stripe Charge)
  const charge = await guard.wrap('STRIPE_CHARGE', 'order_9832', { amount: 5000 }, async () => {
    // If the job retries, this block will be SKIPPED and the original charge returned.
    return await stripe.charges.create({ amount: 5000, currency: 'usd' });
  });

  // 2. Register optional rollback compensation if a later step fails
  await guard.compensate('STRIPE_CHARGE', 'order_9832', { amount: 5000 }, {
    type: 'STRIPE_REFUND',
    target: charge.id,
  });

  // Imagine a transient database crash happens here:
  await db.orders.update({ id: 'order_9832', status: 'PAID' });
}, {
  // 3. Rollback triggered automatically if the block throws
  onRollback: async (action) => {
    if (action.type === 'STRIPE_REFUND') {
      await stripe.refunds.create({ charge: action.target });
    }
  }
});
```

---

## ⚡ Advanced Features

StillUp is designed specifically for high-load reliability engineering:

*   **Deterministic Fingerprinting (Safe Defaults)**: Strips transient noise like `timestamp`, `requestId`, `createdAt`, and `traceId` automatically before hashing. Only your semantic payload inputs determine the fingerprint.
*   **Fast-Path Circuit Breaking**: Uses an in-memory TTL map in the API service. If a client is caught in an infinite retry storm, we trip the execution circuit breaker without hammering Postgres, saving your database from collapse.
*   **Network Resilience (SDK-embedded)**: Native timeout wraps (3s) and exponential backoff retries with full jitter protect your workers from blocking on StillUp API latency.
*   **Fail-Safe Policies**: Choose how the SDK behaves if StillUp goes down:
    *   `OPEN` (Default): High Availability. Proceed with execution if safety cannot be verified.
    *   `CLOSED`: High Integrity. Block execution if safety cannot be verified (e.g., financial ops).
*   **Self-Healing with Rate-Limiting & Jitter**: Triggers auto-replays on monitor failure, but applies randomized jitter delay (5–30s) and minimum cooldown rate-limits to avoid a stampeding herd after an outage.

---

## 🔌 Framework Adapters

StillUp provides zero-boilerplate wrappers for the most popular workflow and AI frameworks:

*   **AI Agents**: [LangGraph](./docs/integrations/langgraph.md) & [CrewAI](./docs/integrations/crewai.md) adapters to guard expensive LLM actions.
*   **Workflows**: [Inngest](./docs/integrations/inngest.md) & [n8n](./docs/integrations/n8n.md) steps to enforce external API idempotency.
*   **Data Pipelines**: Apache Airflow execution guards.

---

## 🚀 Quick Start (Docker)

The fastest way to deploy StillUp locally:

```bash
# 1. Clone the repository
git clone https://github.com/StillUp/StillUp.git && cd StillUp

# 2. Launch the stack
docker-compose up -d
```
Visit `http://localhost:3000` to access the dashboard.

---

## 📖 Technical Documentation

*   [Introduction & Core Concepts](./docs/introduction.md)
*   [Architecture, DB Cache, & Fail Policies](./docs/architecture.md)
*   [API Schema Reference](./docs/api-reference.md)
*   [Self-Hosted Deployment Guide](./docs/self-hosted-guide.md)

## ⚖️ License

StillUp is open-source software licensed under the [AGPL-3.0 License](LICENSE).

<div align="center">
  <p>Built with ❤️ by the StillUp Team</p>
</div>
