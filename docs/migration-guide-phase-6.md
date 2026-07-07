# Migration Guide: Phase 6 (Execution Ledger)

This guide documents the changes introduced in Phase 6, upgrading Replaysafe from a simple binary deduplication check into a full **Execution Ledger**. It outlines how to adopt the new features, structural changes in the SDK and API, and how backward compatibility is preserved.

---

## What's New in Phase ?

### 1. Full Lifecycle State Machine
Instead of a binary EXECUTE/SKIP record, every side effect now transitions through a rich state machine tracked in real time:
- `INTENDED`: Declared intent, before execution.
- `EXECUTING`: Lambda invoked, waiting for result.
- `COMMITTED`: Completed successfully, result and receipt stored.
- `VERIFIED`: Confirmed correct by provider-side check (Phase 7).
- `UNKNOWN`: Timed out or crashed mid-run (outcome uncertain).
- `FAILED`: Lambda threw an error.
- `COMPENSATED`: Rollback completed.
- `SKIPPED`: Bypassed using cache.

### 2. New SDK Primitive: `guard.effect()`
`guard.effect()` replaces `guard.wrap()` as the primary way to declare, execute, and record side effects. It natively tracks the entire state lifecycle and supports timeouts.

### 3. Workflow & Agent Tracking
`guard.start()` now accepts `workflowId` and `agentId` to group all executions and side effects belonging to a single agent run.

---

## SDK Changes

### Upgrading to `guard.effect()`
If you want to use the full execution ledger lifecycle, transition from `guard.wrap()` to `guard.effect()`:

#### Before (`guard.wrap`):
```typescript
const charge = await guard.wrap(
  "stripe.charge",
  order.id,
  { amount, currency, customerId },
  async () => stripe.charges.create({ amount, currency, customer: customerId })
);
```

#### After (`guard.effect`):
```typescript
const charge = await guard.effect({
  type: "stripe.charge",
  target: order.id,
  input: { amount, currency, customerId },
  provider: "stripe", // Tag provider for ledger views
  timeoutMs: 30000,   // Optional: defaults to 30s
  execute: async () => stripe.charges.create({ amount, currency, customer: customerId }),
  receipt: (result) => ({ chargeId: result.id }) // Extract provider-native proof
});
```

### Timeout Handling
`guard.effect()` throws an `EffectTimeoutError` if your execute function runs longer than `timeoutMs`. When this happens, Replaysafe marks the side effect as `UNKNOWN` in the ledger.
```typescript
import { EffectTimeoutError } from "@replaysafe/guard-sdk";

try {
  const result = await guard.effect({ ... });
} catch (error) {
  if (error instanceof EffectTimeoutError) {
    // The operation timed out. Do not retry blindly.
    // Phase 7 verification will reconcile this outcome.
  }
}
```

### Backward Compatibility (Zero Migration Required)
`guard.wrap()` has been rewritten as a zero-overhead compatibility shim over `guard.effect()` with `timeoutMs: 0`. **Existing code using `guard.wrap()` will continue to function exactly as before without any modifications.**

---

## API & Database Schema Changes

### Schema Updates
The `GuardSideEffect` table has been updated with the following fields:
- `status`: `SideEffectStatus` enum (defaults to `COMMITTED`).
- `receipt`: `Json` for provider proof.
- `provider`: `String` for provider identification.
- `workflowId` & `agentId`: `String` for grouping.
- `startedAt` & `finishedAt`: `DateTime` transition timestamps.
- `parentSideEffectId`: `String` for lineage tracking.

### New API Endpoints
The following endpoints have been added to support real-time state tracking:
- `POST /api/guards/effect/begin`: Checks deduplication and registers status as `EXECUTING`.
- `POST /api/guards/effect/commit`: Marks status as `COMMITTED` and records receipts.
- `POST /api/guards/effect/unknown`: Transitions status to `UNKNOWN` on timeouts.
- `GET /api/guards/workflow/:workflowId`: Lists all side effects for a workflow group.

`PATCH /api/guards/execution/:id` has also been updated to accept `UNKNOWN` as a valid execution finalization status.

---

## Dashboard Visualizations

The execution details page (`/dashboard/guards/[id]`) has been updated to show:
1. **Interactive Timelines**: Displays full transition phases (`INTENDED` $\rightarrow$ `EXECUTING` $\rightarrow$ `COMMITTED`) with timestamps and execution durations.
2. **Provider Receipts**: An expandable panel showcasing the extracted provider-native metadata (e.g. `chargeId`, `messageId`) stored in the database.
