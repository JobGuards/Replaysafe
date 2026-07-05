<div align="center">
<img width="150" height="160" alt="Replaysafe logo" src="https://github.com/user-attachments/assets/7bf8e426-9649-4df6-a4c3-2269ebae02b1" />

  <h1>Replaysafe</h1>
  <p><strong>Execution memory and side-effect control plane for AI agents.</strong></p>
  <p>When an agent crashes, retries, or gets interrupted mid-task — it never repeats what it already did, and it always knows exactly how to pick back up.</p>

  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-acidlime.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-1.1.0--alpha-blue.svg)]()
  [![npm](https://img.shields.io/badge/npm-%40replaysafe%2Fguard--sdk-cb3837)](https://www.npmjs.com/package/@replaysafe/guard-sdk)
</div>

---

## The Problem

AI agents are taking real actions in the real world — charging cards, sending emails, filing tickets, calling APIs. When one of those agents crashes mid-task, nobody can say for certain what already happened.

```
Step 1 → stripe.charge($500)          ✅ Charged  (Stripe's own idempotency key handles this)
Step 2 → sendgrid.send(invoice_email) ✅ Email sent
Step 3 → crm.update(status=paid)      ❌ Process dies here

Retry → workflow re-runs from the top
Step 1 → stripe.charge($500)          ✅ Stripe blocks the duplicate (their key)
Step 2 → sendgrid.send(invoice_email) ❌ Customer emailed AGAIN
Step 3 → crm.update(status=paid)      Retried unnecessarily
```

Stripe protects Stripe — but only Stripe. There is no built-in idempotency for your email provider, your CRM, your Slack notification, or your audit log. Those re-run on every retry, and nobody tracks which ones already succeeded.

---

## The Solution

Replaysafe wraps every external call your agent makes with a cryptographic fingerprint. Before each operation executes, it checks whether that exact operation already ran in a previous attempt. If it did — it returns the cached result and skips execution. If it didn't — it runs, stores the result, and that record protects all future retries.

When your agent's workflow re-runs from the top after a crash:

- Steps that already succeeded → **skip instantly**, return cached result
- Steps that didn't run yet → **execute normally**
- If the whole workflow fails → **registered rollbacks fire automatically**

The workflow code itself doesn't change. Each call to `guard.wrap()` is the check.

---

## Quick Start

```bash
npm install @replaysafe/guard-sdk
```

```typescript
import { withReplayGuard } from '@replaysafe/guard-sdk';

await withReplayGuard(
  { apiKey: process.env.REPLAYSAFE_API_KEY, monitorId: 'your-monitor-id' },
  async (guard) => {
    const inputs = { amount: 5000, currency: 'usd', orderId: 'order_9832' };

    // Wrap the Stripe call — records proof in Replaysafe's ledger that this step ran.
    // On retry: Replaysafe skips re-calling Stripe AND knows the charge completed,
    // so downstream steps (email, CRM) can also be safely skipped.
    // Stripe's own idempotency key handles the Stripe-level dedup — the fingerprint
    // passed here gives Stripe a deterministic key that survives process restarts.
    const charge = await guard.stripe('order_9832', inputs, async () =>
      stripe.charges.create(
        { amount: 5000, currency: 'usd' },
        { idempotencyKey: guard.fingerprint('STRIPE_OPERATION', 'order_9832', inputs) }
      )
    );

    // Register a rollback — auto-triggered if the workflow throws after this point.
    await guard.compensate('STRIPE_OPERATION', 'order_9832', inputs, {
      type: 'STRIPE_REFUND',
      target: charge.id,
    });

    // This crashes and the agent retries — the charge above is NOT repeated.
    await db.orders.update({ id: 'order_9832', status: 'PAID' });
  },
  {
    onRollback: async (action) => {
      if (action.type === 'STRIPE_REFUND') {
        await stripe.refunds.create({ charge: action.target });
      }
    },
  }
);
```

---

## What Gets Recorded

Every guarded operation creates a ledger entry:

```
status: COMPLETED  — operation ran and result was stored
status: SKIPPED    — already ran in a previous attempt, cached result returned
status: PENDING    — rollback registered, waiting to fire
```

Each entry stores the operation type, target, input fingerprint, result, and timestamp. On any retry, the ledger is checked first — matching fingerprint means skip.

> **Upcoming (on the roadmap):** An `UNKNOWN` state for timed-out calls, and automatic provider-side verification (checking Stripe, SendGrid, etc.) before any retry.

---

## SDK Methods

| Method | What it does |
|---|---|
| `guard.wrap(type, target, inputs, fn)` | Generic operation wrapper — deduplicate any side effect |
| `guard.stripe(opId, inputs, fn)` | Records Stripe calls in the ledger; passes a deterministic fingerprint as Stripe's idempotency key |
| `guard.ai(model, params, fn)` | LLM call deduplication — pay for expensive generations once |
| `guard.webhook(target, payload, fn)` | Outbound webhook safety |
| `guard.fetch(url, options)` | HTTP wrapper with auto-injected `Idempotency-Key` header |
| `guard.compensate(type, target, inputs, rollback)` | Register a rollback action for auto-trigger on failure |
| `guard.fingerprint(type, target, inputs)` | Compute and expose the fingerprint (pass to Stripe, etc.) |
| `guard.snapshot(key, state)` | Record infrastructure state to detect drift between retries |

### Framework Adapters

Drop-in adapters for AI and workflow frameworks — same safety engine, semantically named:

| Framework | Method |
|---|---|
| **LangGraph** | `guard.langGraph(nodeId, inputs, fn)` |
| **CrewAI** | `guard.crewai(toolName, inputs, fn)` |
| **Inngest** | `guard.inngest(functionId, inputs, fn)` |
| **n8n** | `guard.n8n(nodeName, inputs, fn)` |
| **Apache Airflow** | `guard.airflow(taskId, inputs, fn)` |
| **Anthropic MCP** | `guard.mcp()` *(coming in Phase 9)* |
| **OpenAI Assistants** | `guard.openai()` *(coming in Phase 9)* |

---

## Self-Hosted in One Command

```bash
git clone https://github.com/Replaysafe/Replaysafe.git && cd Replaysafe
docker-compose up -d
```

Visit `http://localhost:3000` for the dashboard. Zero external telemetry. Sovereign mode — your data stays on your infrastructure.

---

## SDK Behavior When Replaysafe Is Unreachable

Choose how the SDK behaves if the API is down:

| Policy | Behavior | Use when |
|---|---|---|
| `OPEN` (default) | Proceed with execution | High availability matters more than strict dedup |
| `CLOSED` | Block execution | Duplicate side effects are catastrophic (payments, emails) |

The SDK never blocks your agent due to its own network issues. Every API call has a 3s timeout with exponential backoff — if Replaysafe is slow, your agent doesn't wait.

---

## Upcoming

- **Execution Ledger (`guard.effect()`)** — full lifecycle per side effect: `INTENDED → EXECUTING → COMMITTED → VERIFIED`, with timestamps at every transition and a stored provider receipt (charge ID, message ID, etc.).
- **`UNKNOWN` state** — when a call times out mid-flight, the effect is flagged `UNKNOWN` instead of silently missing, giving a defined state to recover from rather than guessing.
- **Provider-side Verification** — before any retry of an `UNKNOWN` effect, Replaysafe checks the provider directly (Stripe, SendGrid, GitHub, Slack, Twilio) to confirm whether it actually completed.
- **`guard.resume(workflowId)`** — crashed multi-step workflows continue from the minimal safe checkpoint: verified steps skip, uncertain steps are checked first, failed steps trigger compensation.
- **Anthropic MCP & OpenAI Assistants adapters** — `guard.mcp()` and `guard.openai()` wrap framework-native tool calls with ledger-backed memory so retries skip already-completed tool calls automatically.
- **Agent Execution Memory API** — `GET /agents/:id/effects` answers "what has this agent already done?" across all runs: verified, unknown, and failed effects queryable in one call.
- **Cross-agent coordination** — shared project-level ledger means two independent agents operating on the same resource cannot silently double-execute; conflict is flagged before it causes damage.


---

## Documentation

- [Introduction & Core Concepts](./docs/introduction.md)
- [Architecture & Fail Policies](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [Self-Hosted Deployment](./docs/self-hosted-guide.md)

## License

Replaysafe is open-source under the [AGPL-3.0 License](LICENSE). Commercial licenses are available for teams that cannot open-source under AGPL.

<div align="center">
  <p>Built with ❤️ by the Replaysafe Team</p>
</div>
