<div align="center">
<img width="150" height="160" alt="Replaysafelogo" src="https://github.com/user-attachments/assets/7bf8e426-9649-4df6-a4c3-2269ebae02b1" />

  <h1>Replaysafe</h1>
  <p><strong>The safety layer for AI agents and async workflows.</strong></p>
  <p>Prevent duplicate side effects — double charges, repeated emails, redundant API calls — when AI agents and background jobs fail and retry.</p>
  
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-acidlime.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.0.0--alpha-blue.svg)]()
  [![npm](https://img.shields.io/badge/npm-%40replaysafe%2Fguard--sdk-cb3837)](https://www.npmjs.com/package/@replaysafe/guard-sdk)
</div>

---

## 🔴 The Problem: AI Agents Don't Know What They Already Did

When an AI agent fails mid-execution and retries, it re-runs from scratch — with no memory of which tool calls already succeeded.

```
1. agent.tool("stripe.charge", amount=500)        ✅ Charged $500
2. agent.tool("db.update_order", status="paid")    ❌ Crashes here
3. RETRY → agent reruns from scratch
4. agent.tool("stripe.charge", amount=500)        ❌ Charged $500 AGAIN
```

The customer is double-charged. The agent doesn't know. You find out from a support ticket.

### This gets worse at scale:

| Scenario | Without Replaysafe | With Replaysafe |
|----------|-------------------|--------------------|
| Agent retries after DB crash | Double charge | Returns cached result |
| Agent retries after LLM timeout | Pays for 2 LLM calls + duplicate side effect | Skips cached side effect |
| Agent makes 50 tool calls, fails at #48 | Reruns all 50 on retry | Skips #1–47, resumes at #48 |

The same problem hits traditional background jobs, queues, and cron jobs — but AI agents make it worse because they're **non-deterministic**. You can't pre-compute idempotency keys. Every retry is a gamble.

---

## 🟢 The Primitive: ReplayGuard

ReplayGuard wraps your non-idempotent side effects with a cryptographic fingerprint. Before executing, it checks if this exact operation already ran. If it did — it returns the cached result and skips execution. If it didn't — it executes, caches the result, and tracks it for potential rollback.

### Guarantees
- **Replay-safe retries** — same input, same result, no duplicate execution
- **Deduplication** — cryptographic fingerprinting across all retries
- **Rollback compensation** — register undo actions that auto-trigger on failure
- **Stable execution fingerprints** — transient fields (timestamps, trace IDs, UUIDs) stripped automatically

### Example: AI Agent with Stripe Double-Charge Prevention

```typescript
import { withReplayGuard } from '@replaysafe/guard-sdk';

const config = {
  apiKey: process.env.REPLAYSAFE_API_KEY,
  monitorId: 'your-monitor-id',
};

await withReplayGuard(config, async (guard) => {
  // 1. Guard a non-idempotent operation — safe to retry
  const charge = await guard.wrap('STRIPE_CHARGE', 'order_9832', { amount: 5000 }, async () => {
    // If the agent retries, this block is SKIPPED and the original charge result returned.
    return await stripe.charges.create({ amount: 5000, currency: 'usd' });
  });

  // 2. Register a rollback — automatically triggered if the workflow throws
  await guard.compensate('STRIPE_CHARGE', 'order_9832', { amount: 5000 }, {
    type: 'STRIPE_REFUND',
    target: charge.id,
  });

  // If this crashes and the agent retries — the charge above is NOT repeated.
  await db.orders.update({ id: 'order_9832', status: 'PAID' });
}, {
  onRollback: async (action) => {
    if (action.type === 'STRIPE_REFUND') {
      await stripe.refunds.create({ charge: action.target });
    }
  }
});
```

### AI Agent Example: LLM Cost Protection

```typescript
import { withReplayGuard } from '@replaysafe/guard-sdk';

await withReplayGuard(config, async (guard) => {
  // guard.ai() deduplicates expensive LLM calls — if the agent retries,
  // the cached completion is returned instead of paying for a second call.
  const summary = await guard.ai('gpt-4o', { prompt, temperature: 0 }, async () => {
    return await openai.chat.completions.create({ model: 'gpt-4o', messages });
  });

  // Protect the downstream side effect too
  await guard.wrap('EMAIL', user.email, { subject: 'Your summary' }, async () => {
    return await sendEmail(user.email, summary);
  });
});
```

---

## ⚡ Features

*   **Deterministic Fingerprinting**: Strips transient noise like `timestamp`, `requestId`, `createdAt`, and `traceId` automatically before hashing. Only semantic payload inputs determine the fingerprint.
*   **Rollback Compensation** (`guard.compensate()`): Register undo actions that execute automatically if the workflow fails mid-run. Saga pattern in 3 lines.
*   **Fail-Safe Policies**: Choose how the SDK behaves if Replaysafe is unreachable:
    *   `OPEN` (Default): Proceed with execution — high availability for non-critical operations.
    *   `CLOSED`: Block execution — high integrity for financial operations where duplicates are catastrophic.
*   **Fast-Path Circuit Breaking**: In-memory TTL circuit breaker trips after 5 consecutive retry loops, with 60-minute cooldown. Prevents retry storms from hammering your database.
*   **Network Resilience**: 3s timeout + exponential backoff with full jitter on every SDK→API call. Replaysafe going slow never blocks your workers.
*   **Self-Healing with Jitter**: Auto-replays on monitor failure with randomized delay (5–30s) to prevent thundering herd after outages.

---

## 🔌 Framework Adapters

Drop-in adapters for the most common AI and workflow frameworks. Every adapter uses the same `guard.wrap()` core — only the intent label changes.

```bash
npm install @replaysafe/guard-sdk
```

### AI Agents
| Framework | Method | Guide |
|-----------|--------|-------|
| **LangGraph** | `guard.langGraph(nodeId, inputs, fn)` | [Integration Guide →](./docs/integrations/langgraph.md) |
| **CrewAI** | `guard.crewai(toolName, inputs, fn)` | [Integration Guide →](./docs/integrations/crewai.md) |

### Workflow Engines
| Framework | Method | Guide |
|-----------|--------|-------|
| **Inngest** | `guard.inngest(functionId, inputs, fn)` | [Integration Guide →](./docs/integrations/inngest.md) |
| **n8n** | `guard.n8n(nodeName, inputs, fn)` | [Integration Guide →](./docs/integrations/n8n.md) |
| **Apache Airflow** | `guard.airflow(taskId, inputs, fn)` | [Integration Guide →](./docs/integrations/langgraph.md#pattern) |

### Generic (Any Framework)
```typescript
// Works with any custom agent, queue, or job runner
const result = await guard.wrap(
  'MY_OPERATION',           // Type label — appears in dashboard
  'unique-operation-id',    // Target identifier
  { ...semanticInputs },    // Input hash — transient fields stripped automatically
  () => myDangerousSideEffect()
);
```

---

## 🚀 Quick Start (Docker)

The fastest way to run Replaysafe locally:

```bash
# 1. Clone the repository
git clone https://github.com/Replaysafe/Replaysafe.git && cd Replaysafe

# 2. Launch the full stack
docker-compose up -d
```

Visit `http://localhost:3000` to access the dashboard.

---

## 📖 Technical Documentation

*   [Introduction & Core Concepts](./docs/introduction.md)
*   [Architecture, DB Cache, & Fail Policies](./docs/architecture.md)
*   [API Schema Reference](./docs/api-reference.md)
*   [Self-Hosted Deployment Guide](./docs/self-hosted-guide.md)
*   [Framework Integrations](./docs/integrations/README.md)

## ⚖️ License

Replaysafe is open-source software licensed under the [AGPL-3.0 License](LICENSE). Commercial licenses are available for teams that cannot open-source their products under AGPL.

<div align="center">
  <p>Built with ❤️ by the Replaysafe Team</p>
</div>
