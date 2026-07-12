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

### TypeScript/JavaScript

```bash
npm install @replaysafe/guard-sdk
```

```typescript
import { ReplayGuard } from "@replaysafe/guard-sdk";

const guard = new ReplayGuard({
  apiKey: process.env.REPLAYSAFE_API_KEY,
  monitorId: "your-monitor-id"
});

// Start an agent execution session
await guard.start("order_9832", "workflow_abc", "agent_123");

// Protect side effects with execution lifecycle
const charge = await guard.effect({
  type: "STRIPE_CHARGE",
  target: "order_9832",
  input: { amount: 5000, currency: "usd" },
  provider: "stripe",
  execute: () => stripe.charges.create({ amount: 5000, currency: "usd" }),
  receipt: (result) => ({ chargeId: result.id }),
});

// Finalize session
await guard.complete("SUCCESS");
```

### Python

```bash
pip install guard-sdk-python
```

```python
from replaysafe import ReplayGuard

guard = ReplayGuard({
    "apiKey": "your-api-key",
    "monitorId": "your-monitor-id"
})

# Start an agent execution session
guard.start(external_id="order_9832", workflow_id="workflow_abc", agent_id="agent_123")

# Protect side effects with execution lifecycle
charge = guard.effect(
    type_str="STRIPE_CHARGE",
    target="order_9832",
    execute_fn=lambda: stripe.charges.create(amount=5000, currency="usd"),
    input_data={"amount": 5000, "currency": "usd"},
    provider="stripe",
    receipt_fn=lambda res: {"charge_id": res.id}
)

# Finalize session
guard.complete(status="SUCCESS")
```

---

## SDK Methods & Framework Adapters

Replaysafe features native SDK support for both Node.js/TypeScript and Python.

### Core Ledger Primitives

| Method | What it does |
| --- | --- |
| `guard.effect(options)` | Standard ledger wrapper (tracks lifecycle `INTENDED → EXECUTING → COMMITTED → VERIFIED`) |
| `guard.resume(workflowId)` | Load continuation/recovery plan for crashed workflows |
| `guard.reconcile(workflowId)` | Trigger explicit verification check for `UNKNOWN` states |
| `guard.compensate(...)` | Register rollback action for autonomous compensation |
| `guard.snapshot(key, state)` | Capture state checkpoints to detect drift between retries |

### Framework-Native Adapters

Drop-in wrappers/decorators for major AI agent and workflow orchestrators:

| Orchestrator | TS/JS Adapter | Python Adapter |
| --- | --- | --- |
| **CrewAI** | `guard.crewai(toolName, inputs, fn)` | `@replay_safe_tool(guard, ...)` |
| **LangChain / LangGraph** | `guard.langGraph(nodeId, inputs, fn)` | `@replay_safe_langchain_tool(...)` |
| **Anthropic MCP** | `guard.mcp(toolName, inputs, fn)` | Built-in tool wrappers |
| **OpenAI Assistants** | `guard.openai(toolName, inputs, fn)` | Built-in tool wrappers |
| **Inngest** | `guard.inngest(functionId, inputs, fn)` | — |
| **n8n** | `guard.n8n(nodeName, inputs, fn)` | — |
| **Apache Airflow** | `guard.airflow(taskId, inputs, fn)` | — |

---

## Advanced Capabilities (Phases 6–10)

Replaysafe features the following production-grade agent resilience primitives:
- **Automatic Provider Verification**: When side effects time out or crash, they transition to `UNKNOWN`. Before retry, Replaysafe queries the provider (Stripe, Twilio, SES, SendGrid, Slack, AWS S3) to verify if the action completed.
- **Semantic/Transient Classification**: Distinguishes structural bugs (`SEMANTIC` failures requiring human intervention or re-planning) from transient errors (`TRANSIENT` network errors safe to auto-retry).
- **Cross-Agent Coordination**: A project-wide shared ledger dynamically detects concurrency conflicts and automatically blocks/fails duplicate operations before double-charges occur.

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
| --- | --- | --- |
| `OPEN` (default) | Proceed with execution | High availability matters more than strict dedup |
| `CLOSED` | Block execution | Duplicate side effects are catastrophic (payments, emails) |

The SDK never blocks your agent due to its own network issues. Every API call has a 3s timeout with exponential backoff — if Replaysafe is slow, your agent doesn't wait.

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
