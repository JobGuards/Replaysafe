# Replaysafe + Inngest: Replay-Safe Side Effects for Event-Driven Functions

Inngest provides durable, event-driven function execution with automatic retries and `step.run()` — but `step.run()` only deduplicates Inngest's own internal state, not the external side effects you make inside those steps.

If your Inngest step charges a customer via Stripe, sends an email, or calls an external API and then crashes mid-execution, the step will be retried and that external call fires again.

**Replaysafe fills that gap.** Wrap external side effects inside your Inngest steps with `guard.inngest()` for replay-safe deduplication — the external API call executes at most once per unique input set, regardless of how many times Inngest retries the step.

---

## Installation

```bash
npm install @replaysafe/guard-sdk
```

---

## Quick Start

```typescript
import { inngest } from "./inngest-client";
import { withReplayGuard } from "@replaysafe/guard-sdk";

export const onUserCreated = inngest.createFunction(
  { id: "user-onboarding", retries: 3 },
  { event: "user/created" },
  async ({ event, step }) => {
    await step.run("setup-stripe-customer", async () => {
      // ✅ Even if Inngest retries this step, the customer is created at most once per unique input set
      return withReplayGuard(
        {
          apiKey: process.env.REPLAYSAFE_API_KEY!,
          monitorId: "user-onboarding",
          baseUrl: process.env.REPLAYSAFE_API_URL,
        },
        async (guard) => {
          const customer = await guard.inngest(
            "create-stripe-customer",
            { email: event.data.email, userId: event.data.userId },
            () => stripe.customers.create({ email: event.data.email }),
          );
          return customer.id;
        },
        { externalId: `onboarding-${event.data.userId}` },
      );
    });

    await step.run("send-welcome-email", async () => {
      return withReplayGuard(
        {
          apiKey: process.env.REPLAYSAFE_API_KEY!,
          monitorId: "user-onboarding",
        },
        async (guard) => {
          await guard.inngest("welcome-email", { to: event.data.email }, () =>
            resend.emails.send({
              from: "welcome@yourapp.com",
              to: event.data.email,
              subject: "Welcome aboard!",
            }),
          );
        },
        { externalId: `welcome-${event.data.userId}` },
      );
    });
  },
);
```

---

## Low-Level API (Single Step)

> [!WARNING]
> **Do not share a single `ReplayGuard` instance across multiple `step.run()` calls.**
>
> Inngest works by **re-executing the entire function** from the top each time it resumes after a step. This means any in-memory state — including a `ReplayGuard` instance and its session context — is destroyed and re-created on every resume. A guard started before `step.run('charge', ...)` will have `context = null` by the time `step.run('notify', ...)` executes, causing it to silently fall through to unprotected `EXECUTE`.
>
> **The correct pattern: one `withReplayGuard` per step**, each with a unique `externalId` tied to the step + event ID.

For fine-grained control within a single step:

```typescript
import { ReplayGuard } from "@replaysafe/guard-sdk";

export const processPayment = inngest.createFunction(
  { id: "process-payment" },
  { event: "payment/requested" },
  async ({ event, step }) => {
    // Each step gets its own isolated guard session.
    // The externalId ties this to the specific event + step combination.
    const chargeId = await step.run("charge", async () => {
      const guard = new ReplayGuard({
        apiKey: process.env.REPLAYSAFE_API_KEY!,
        monitorId: "payment-flow",
        failPolicy: "OPEN",
      });

      await guard.start(`${event.data.paymentId}-charge`);

      try {
        const inputs = {
          amount: event.data.amount,
          customerId: event.data.stripeId,
        };
        const charge = await guard.inngest("stripe-charge", inputs, () =>
          stripe.charges.create(
            {
              amount: event.data.amount,
              customer: event.data.stripeId,
              currency: "usd",
            },
            {
              idempotencyKey: guard.fingerprint(
                "INNGEST_STEP",
                "stripe-charge",
                inputs,
              ),
            },
          ),
        );
        await guard.complete("SUCCESS");
        return charge.id;
      } catch (e) {
        await guard.complete("FAILED", true);
        throw e;
      }
    });

    await step.run("notify", async () => {
      const guard = new ReplayGuard({
        apiKey: process.env.REPLAYSAFE_API_KEY!,
        monitorId: "payment-flow",
      });
      await guard.start(`${event.data.paymentId}-notify`);
      try {
        await guard.inngest(
          "send-receipt",
          { chargeId, email: event.data.email },
          () => sendReceipt(chargeId, event.data.email),
        );
        await guard.complete("SUCCESS");
      } catch (e) {
        await guard.complete("FAILED", true);
        throw e;
      }
    });
  },
);
```

---

## Replaysafe vs. Inngest's Built-In Idempotency

| Mechanism                        | Scope                                                                |
| -------------------------------- | -------------------------------------------------------------------- |
| `step.run()`                     | Deduplicates Inngest's _execution state_ — not external side effects |
| Inngest event deduplication key  | Prevents the same event from triggering multiple runs                |
| **Replaysafe `guard.inngest()`** | Deduplicates the actual _external API calls_ inside your steps       |

These are complementary. Use all three for maximum safety.

---

## Self-Hosted Setup

```bash
docker-compose up -d
REPLAYSAFE_API_URL=http://localhost:4040
```

---

## More Resources

- [LangGraph Integration](./langgraph.md)
- [Temporal Integration](./temporal.md)
- [n8n Integration](./n8n.md)
- [API Reference](../api-reference.md)
