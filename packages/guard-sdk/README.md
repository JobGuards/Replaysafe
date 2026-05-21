# @replaysafe/guard-sdk

ReplayGuard is the replay-safe execution layer for AI agents and background jobs. Prevent dangerous duplicate side effects during retries, detect state drift, and handle automated rollbacks.

## Installation

```bash
npm install @replaysafe/guard-sdk
```

## Basic Usage

```typescript
import { withReplayGuard } from '@replaysafe/guard-sdk';

const config = {
  apiKey: process.env.REPLAYSAFE_API_KEY,
  monitorId: 'your-monitor-id',
  debug: true
};

await withReplayGuard(config, async (guard) => {
  // 1. Guard an idempotent side effect
  const charge = await guard.wrap('STRIPE_CHARGE', 'customer_123', { amount: 5000 }, async () => {
    return await stripe.charges.create({ ... });
  });

  // 2. Register a compensation action for automatic rollback
  await guard.compensate('STRIPE_CHARGE', 'customer_123', { amount: 5000 }, {
    type: 'STRIPE_REFUND',
    target: charge.id,
    payload: { reason: 'Job failed' }
  });

  // If this code fails, the rollback hook below will be triggered
  throw new Error("Job crashed!");
}, {
  // 3. Handle rollbacks locally
  onRollback: async (rollback) => {
    console.log(`Executing local cleanup: ${rollback.type}`);
    if (rollback.type === 'STRIPE_REFUND') {
      await stripe.refunds.create({ charge: rollback.target });
    }
  }
});
```

## 🚀 Production Safety Features

### 1. Fail-Safe Policies
Choose how the SDK behaves if the Replaysafe API is unreachable.
- `OPEN` (Default): Proceed with execution if safety cannot be verified (High availability).
- `CLOSED`: Block execution if safety cannot be verified (High integrity).

```typescript
const guard = new ReplayGuard({
  apiKey: '...',
  monitorId: '...',
  failPolicy: 'CLOSED' // Block on API failure
});
```

### 2. State Drift Detection (Phase 2)
Capture snapshots of infrastructure state to detect unexpected changes between job attempts.

```typescript
await guard.snapshot('k8s-deployment', currentDeploymentState);
```

### 3. Project-Wide Deduplication
Prevent duplicate side effects across different monitors or workers in the same project.

```typescript
await guard.verify('AI_ACTION', 'llm-summarize', inputs, 'PROJECT');
```

## 📈 Replay Intelligence
Every "SKIPPED" action is tracked in the **Replaysafe Dashboard**, calculating your **Safety ROI** (Prevented double-charges and engineering hours saved).
