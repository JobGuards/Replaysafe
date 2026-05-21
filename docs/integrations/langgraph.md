# Replaysafe + LangGraph: Replay-Safe Retries for Agent Nodes

LangGraph is powerful for building stateful, multi-step AI agents — but when a node fails and the graph retries, every side effect in that node (API calls, database writes, emails) re-executes from scratch. This causes duplicate charges, phantom records, and corrupted downstream state.

**Replaysafe acts as the airbag.** Wrap any side-effecting tool call inside a LangGraph node with `guard.langGraph()` and it will be deduplicated — even across retries, the external side effect executes at most once per unique input set.

---

## Installation

```bash
npm install @replaysafe/guard-sdk
```

---

## Quick Start

```typescript
import { withReplayGuard } from '@replaysafe/guard-sdk';

// Wrap your entire LangGraph graph run
const result = await withReplayGuard(
  {
    apiKey: process.env.REPLAYSAFE_API_KEY!,
    monitorId: 'langgraph-customer-onboarding',
    baseUrl: process.env.REPLAYSAFE_API_URL,
  },
  async (guard) => {
    // Pass guard through LangGraph's `configurable` — it's the correct channel
    // for runtime context. A bare second arg is silently ignored.
    return await graph.invoke(
      { customerId },
      { configurable: { guard } }  // ← nodes receive this via RunnableConfig
    );
  },
  { externalId: `onboarding-${customerId}` }  // Tie to your run ID
);
```

---

## Inside a LangGraph Node

The `guard.langGraph()` adapter is a thin, semantically-named wrapper. Pass it the node name, its inputs, and the operation to protect:

```typescript
// nodes/chargeNode.ts
import { ReplayGuard } from '@replaysafe/guard-sdk';

export async function chargeNode(
  state: OnboardingState,
  guard: ReplayGuard
) {
  // ✅ This charge will NOT be duplicated during retries (replay-safe deduplication)
  const charge = await guard.langGraph(
    'charge_customer_node',
    { customerId: state.customerId, amount: state.planAmount },
    () => stripe.charges.create({
      amount: state.planAmount,
      currency: 'usd',
      customer: state.customerId,
    })
  );

  // ✅ The welcome email is also protected
  await guard.langGraph(
    'send_welcome_email_node',
    { to: state.email, chargeId: charge.id },
    () => resend.emails.send({
      from: 'hello@yourapp.com',
      to: state.email,
      subject: 'Welcome!',
    })
  );

  return { ...state, chargeId: charge.id };
}
```

---

## Registering Rollback Compensation

If `chargeNode` succeeds but a downstream node fails, you can automatically trigger a refund:

> [!IMPORTANT]
> The `type`, `target`, and `inputs` passed to `guard.compensate()` must **exactly match** what you passed to `guard.langGraph()` for the same call. Both sides independently hash these values to compute the same fingerprint. Any difference — even a missing key in `inputs` — will silently fail to find the side effect and the rollback will not be registered.

```typescript
// After the charge succeeds, register a compensation hook.
// Use the SAME type/target/inputs as the langGraph() call above.
await guard.compensate(
  'LANGGRAPH_NODE',                                                // ← must match langGraph() type internally
  'charge_customer_node',                                          // ← must match nodeId
  { customerId: state.customerId, amount: state.planAmount },      // ← must match inputs exactly
  {
    type: 'WEBHOOK',
    target: 'https://your-api.com/refund',
    payload: { chargeId: charge.id },
  }
);
```

If the graph run is marked as failed, Replaysafe will fire the compensation webhook automatically.

---

## How It Works

1. **Fingerprinting**: Replaysafe hashes the node name + inputs to create a unique fingerprint for this side effect.
2. **Memory Check**: On retry, before executing the operation, Replaysafe checks if this fingerprint was already executed successfully in a previous attempt.
3. **Skip or Execute**: If a successful result exists → **SKIP** and replay the cached result. If not → **EXECUTE** and record the result.
4. **Zero LangGraph Changes**: You don't modify your graph structure. Just wrap the dangerous calls.

> **Distributed Systems Note**: ReplayGuard is a replay-safety proxy, not a distributed transaction coordinator. Safety guarantees apply within the fingerprint scope and storage window. Under `OPEN` fail policy, if Replaysafe is unreachable, execution proceeds without deduplication.

---

## Wrapping the Graph at the Top Level

For end-to-end protection, pass the `guard` instance via LangGraph's `configurable`:

```typescript
import { RunnableConfig } from '@langchain/core/runnables';
import { ReplayGuard } from '@replaysafe/guard-sdk';

// In your node function signature:
export async function chargeNode(
  state: OnboardingState,
  config: RunnableConfig
) {
  const guard = config.configurable?.guard as ReplayGuard;
  
  if (!guard) {
    // Fallback: execute without safety layer (or throw if CLOSED policy)
    return await stripe.charges.create({ ... });
  }

  return guard.langGraph('charge_customer_node', { ... }, () => stripe.charges.create({ ... }));
}

// When invoking the graph:
await withReplayGuard({ apiKey, monitorId }, async (guard) => {
  await graph.invoke(state, {
    configurable: { guard }
  });
});
```

---

## Fail Policies

| Policy | Behavior when Replaysafe is unreachable |
|---|---|
| `OPEN` (default) | Proceeds without safety layer. Side effects execute normally. |
| `CLOSED` | Throws an error. The graph node fails and LangGraph retries. |

```typescript
new ReplayGuard({ apiKey, monitorId, failPolicy: 'CLOSED' });
```

---

## Self-Hosted Setup

Run Replaysafe locally (zero cloud dependency):

```bash
docker-compose up -d
```

Point the SDK at your local instance:

```bash
REPLAYSAFE_API_URL=http://localhost:4040
```

---

## More Resources

- [API Reference](../api-reference.md)
- [Temporal Integration](./temporal.md)
- [Inngest Integration](./inngest.md)
- [n8n Integration](./n8n.md)
