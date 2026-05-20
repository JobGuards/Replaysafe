# StillUp + n8n: Idempotent Workflow Nodes

n8n makes it easy to build powerful automation workflows, but when a workflow errors and you re-run it (or n8n retries a node automatically), every HTTP Request node, webhook call, and external API action fires again — potentially creating duplicate records, charges, or notifications.

**StillUp solves this with `guard.n8n()`** — a drop-in wrapper for your n8n Code nodes that makes any external call replay-safe: the side effect executes at most once per unique input set, even if n8n re-runs the node.

---

## Installation

Add StillUp to your n8n Custom Code setup:

```bash
# In your n8n custom packages directory
npm install @stillup/guard-sdk
```

Or if you're self-hosting n8n with a custom Docker image, add it to your `package.json`.

---

## Quick Start: Code Node

```javascript
// n8n Code Node (JavaScript)
const { withReplayGuard } = require('@stillup/guard-sdk');

const inputItem = $input.item.json;

const result = await withReplayGuard(
  {
    apiKey: process.env.STILLUP_API_KEY,
    monitorId: 'n8n-crm-sync-workflow',
    baseUrl: process.env.STILLUP_API_URL || 'http://localhost:4040',
  },
  async (guard) => {
    // ✅ This HubSpot contact is created exactly once, even if the workflow re-runs
    const contact = await guard.n8n(
      'hubspot-create-contact',
      { email: inputItem.email, name: inputItem.name },
      async () => {
        const response = await fetch('https://api.hubspot.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: { email: inputItem.email, firstname: inputItem.name },
          }),
        });
        return response.json();
      }
    );

    return contact;
  },
  { externalId: `crm-sync-${inputItem.id}` }  // Use your record ID for idempotency
);

return [{ json: result }];
```

---

## Protecting Multiple Steps in One Code Node

```javascript
const { ReplayGuard } = require('@stillup/guard-sdk');

const item = $input.item.json;
const guard = new ReplayGuard({
  apiKey: process.env.STILLUP_API_KEY,
  monitorId: 'order-fulfillment',
  debug: true,
});

await guard.start(`order-${item.orderId}`);

try {
  // Step 1: Reserve inventory
  const reservation = await guard.n8n(
    'reserve-inventory',
    { orderId: item.orderId, skuId: item.skuId, qty: item.quantity },
    async () => {
      const res = await fetch(`${process.env.INVENTORY_API}/reserve`, {
        method: 'POST',
        body: JSON.stringify({ orderId: item.orderId, skuId: item.skuId }),
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    }
  );

  // Step 2: Send shipping label (only if inventory was reserved)
  await guard.n8n(
    'send-shipping-label',
    { reservationId: reservation.id, email: item.customerEmail },
    async () => {
      const res = await fetch(`${process.env.SHIPPING_API}/label`, {
        method: 'POST',
        body: JSON.stringify({ reservationId: reservation.id }),
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    }
  );

  await guard.complete('SUCCESS');
} catch (e) {
  await guard.complete('FAILED', true);
  throw e;
}

return [{ json: { status: 'fulfilled', orderId: item.orderId } }];
```

---

## Using the Built-In HTTP Fetch Wrapper

For simple HTTP calls, use `guard.fetch()` which wraps the native fetch with replay protection:

```javascript
const { ReplayGuard } = require('@stillup/guard-sdk');

const guard = new ReplayGuard({ apiKey: process.env.STILLUP_API_KEY, monitorId: 'slack-notifier' });
await guard.start(`notify-${$input.item.json.eventId}`);

// This Slack message will only be sent once, even if the node re-runs
const response = await guard.fetch('https://hooks.slack.com/services/YOUR/WEBHOOK/URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: `New signup: ${$input.item.json.email}` }),
});

await guard.complete('SUCCESS');
return [{ json: { notified: true } }];
```

---

## n8n Environment Variables

In your n8n instance, set these environment variables:

```
STILLUP_API_KEY=your-project-api-key
STILLUP_API_URL=https://your-stillup-instance.com  # or http://localhost:4040 for self-hosted
```

---

## Self-Hosted Setup

```bash
docker-compose up -d
```

---

## More Resources

- [LangGraph Integration](./langgraph.md)
- [Temporal Integration](./temporal.md)
- [Inngest Integration](./inngest.md)
- [API Reference](../api-reference.md)
