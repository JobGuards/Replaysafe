# Integrations

ReplayGuard™ is a **framework-agnostic safety proxy**. Drop it in front of any external side effect — regardless of what orchestration framework you're using.

## Supported Frameworks

| Framework | Adapter Method | Guide |
|---|---|---|
| **LangGraph** | `guard.langGraph(nodeId, inputs, fn)` | [LangGraph Integration →](./langgraph.md) |
| **Temporal** | `guard.temporal(activityName, inputs, fn)` | [Temporal Integration →](./temporal.md) |
| **Inngest** | `guard.inngest(functionId, inputs, fn)` | [Inngest Integration →](./inngest.md) |
| **n8n** | `guard.n8n(nodeName, inputs, fn)` | [n8n Integration →](./n8n.md) |
| **CrewAI** | `guard.crewai(toolName, inputs, fn)` | [CrewAI Integration →](./crewai.md) |
| **Apache Airflow** | `guard.airflow(taskId, inputs, fn)` | See [LangGraph guide](./langgraph.md) for pattern |
| **Raw Python / Any** | HTTP API | See [API Reference](../api-reference.md) |

## How It Works

Every adapter is a thin semantic wrapper over the same core `guard.wrap()` engine. The safety mechanism is identical regardless of the framework:

```
Your Framework → guard.langGraph() / guard.temporal() / guard.n8n()
                    ↓
              guard.wrap()  ← Core deduplication engine
                    ↓
         Hash(type + target + inputs) → Check memory
                    ↓
         EXECUTE (first time) or SKIP (replay cached result)
```

## Universal Pattern

All adapters share the same signature:

```typescript
guard.<framework>(
  identifier: string,   // Node/activity/step name
  inputs: any,          // Inputs that determine uniqueness
  operation: () => T,   // The dangerous side effect to protect
  scope?: GuardScope    // 'MONITOR' | 'PROJECT' (default: 'MONITOR')
): Promise<T>
```

## Generic Wrapper

If your framework isn't listed, use `guard.wrap()` directly:

```typescript
const result = await guard.wrap(
  'MY_FRAMEWORK_STEP',      // Type label (appears in dashboard)
  'my-step-identifier',     // Unique step name
  { ...inputs },            // Input hash for fingerprinting
  () => mySideEffect()      // The operation to protect
);
```

## Self-Hosted Quick Start

```bash
git clone https://github.com/StillUp/StillUp.git && cd StillUp
docker-compose up -d
# Visit http://localhost:3000
```

## SDK Installation

```bash
npm install @stillup/guard-sdk
```
