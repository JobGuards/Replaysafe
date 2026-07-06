# Replaysafe + CrewAI: Replay-Safe Tool Execution for AI Agents

CrewAI is great for orchestrating multi-agent workflows — but when an agent hits an error and the crew restarts, every tool call fires again. If an agent called a payment API, created a database record, or sent a notification, those actions duplicate.

**Replaysafe's `guard.crewai()` adapter** wraps any CrewAI tool execution with replay-safe deduplication, acting as a safety proxy between your agents and their external side effects.

---

## Installation

```bash
npm install @replaysafe/guard-sdk
```

For Python-based CrewAI setups, use the HTTP API directly or the forthcoming Python SDK. This guide covers the TypeScript/JavaScript bridge pattern.

---

## Architecture Pattern: Safety Proxy Service

The recommended pattern for Python-based CrewAI is to route all external tool calls through a lightweight TypeScript proxy service that uses Replaysafe:

```
CrewAI Agent → Tool → JS Proxy Service (Replaysafe) → External API
```

---

## TypeScript Proxy Service

```typescript
// safety-proxy.ts — A lightweight Express service your CrewAI tools call
import express from "express";
import { ReplayGuard } from "@replaysafe/guard-sdk";

const app = express();
app.use(express.json());

app.post("/tool/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const { inputs, agentId, runId } = req.body;

  const guard = new ReplayGuard({
    apiKey: process.env.REPLAYSAFE_API_KEY!,
    monitorId: "crewai-agent-run",
    debug: true,
  });

  await guard.start(`${runId}-${agentId}`);

  try {
    const result = await guard.crewai(toolName, inputs, async () => {
      // Route to the actual tool implementation
      return await executeTool(toolName, inputs);
    });

    await guard.complete("SUCCESS");
    res.json({ result });
  } catch (error: any) {
    await guard.complete("FAILED", true);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Direct Usage (TypeScript CrewAI)

If you're using CrewAI's TypeScript SDK or a custom tool runner:

```typescript
import { withReplayGuard } from "@replaysafe/guard-sdk";

async function runCrewTool(
  toolName: string,
  inputs: Record<string, any>,
  agentRunId: string,
) {
  return withReplayGuard(
    {
      apiKey: process.env.REPLAYSAFE_API_KEY!,
      monitorId: "crewai-research-crew",
      baseUrl: process.env.REPLAYSAFE_API_URL,
    },
    async (guard) => {
      // ✅ This tool call executes exactly once per unique input set
      return guard.crewai(toolName, inputs, () =>
        dispatchTool(toolName, inputs),
      );
    },
    { externalId: `${agentRunId}-${toolName}` },
  );
}

// Example: research crew
await runCrewTool(
  "web_search",
  { query: "Replaysafe ReplayGuard pricing 2025", depth: 3 },
  "research-crew-run-001",
);
```

---

## Python CrewAI: HTTP API Pattern

For pure Python setups, call the Replaysafe API directly inside your custom tool:

```python
import requests
import hashlib
import json

REPLAYSAFE_API_KEY = os.environ['REPLAYSAFE_API_KEY']
Replaysafe_URL = os.environ.get('REPLAYSAFE_API_URL', 'http://localhost:4040')

def guarded_tool_call(tool_name: str, inputs: dict, run_id: str, actual_fn):
    """Wraps any tool call with Replaysafe replay-safe deduplication."""

    # Start a session
    session = requests.post(f'{Replaysafe_URL}/api/guards/session',
        headers={'x-api-key': REPLAYSAFE_API_KEY},
        json={'monitorId': 'crewai-agent', 'externalId': f'{run_id}-{tool_name}'}
    ).json()

    execution_id = session['executionId']
    fingerprint = hashlib.sha256(json.dumps({'tool': tool_name, 'inputs': inputs}, sort_keys=True).encode()).hexdigest()

    # Check if already executed
    check = requests.post(f'{Replaysafe_URL}/api/guards/verify',
        headers={'x-api-key': REPLAYSAFE_API_KEY},
        json={'executionId': execution_id, 'fingerprint': fingerprint, 'type': 'CREWAI_TOOL', 'target': tool_name}
    ).json()

    if check['action'] == 'SKIP':
        return check['cachedResult']  # Replay cached result

    # Execute the actual tool
    result = actual_fn()

    # Mark complete
    requests.patch(f'{Replaysafe_URL}/api/guards/execution/{execution_id}',
        headers={'x-api-key': REPLAYSAFE_API_KEY},
        json={'status': 'SUCCESS'}
    )

    return result


# Usage inside a CrewAI custom tool:
from crewai_tools import BaseTool

class SafeSearchTool(BaseTool):
    name: str = "Safe Web Search"
    description: str = "Searches the web with replay-safe deduplication"

    def _run(self, query: str, run_id: str = 'default') -> str:
        return guarded_tool_call(
            'web_search', {'query': query}, run_id,
            lambda: actual_web_search(query)
        )
```

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
- [Inngest Integration](./inngest.md)
- [n8n Integration](./n8n.md)
- [API Reference](../api-reference.md)
