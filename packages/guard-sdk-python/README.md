# Replaysafe Python SDK (`guard-sdk-python`)

The official Python SDK for **Replaysafe** — execution memory and side-effect control plane for AI agents and distributed workflows.

---

## Installation

Install the package via `pip` or your favorite package manager:

```bash
pip install guard-sdk-python
```

---

## Quick Start

### 1. Initialize the Session

Wrap your agent run session to group all downstream side effects under a single execution trace:

```python
from replaysafe import ReplayGuard

# Configure the guard
guard = ReplayGuard({
    "apiKey": "your-api-key",
    "monitorId": "your-monitor-id",
    "baseUrl": "https://api.replaysafe.com", # Default: http://localhost:4040
    "debug": True
})

# Start a session for the agent workflow run
guard.start(
    external_id="order_12345",
    workflow_id="workflow_abc",
    agent_id="payment_agent"
)
```

### 2. Guard Side Effects with `effect()`

Wrap any dangerous or external operations (Stripe charges, Slack notifications, Twilio SMS) inside the `effect` block to track its state and ensure idempotency:

```python
def charge_customer():
    # Call your payment provider here
    return stripe.Charge.create(amount=5000, currency="usd", customer="cust_abc")

# The side effect is tracked through its lifecycle:
# INTENDED -> EXECUTING -> COMMITTED
result = guard.effect(
    type_str="STRIPE_CHARGE",
    target="order_12345",
    execute_fn=charge_customer,
    input_data={"amount": 5000, "currency": "usd"},
    provider="stripe",
    receipt_fn=lambda res: {"charge_id": res.id},
    timeout_ms=30000, # Max 30s before flagging as UNKNOWN
)

print(f"Charge successful: {result['charge_id']}")
```

### 3. Complete the Session

Once the run is complete, finalize the session status:

```python
guard.complete(status="SUCCESS")
```

---

## Framework Adapters

### CrewAI Integration

Prevent custom tools from double-firing when your crew plans, loops, or retries:

```python
from replaysafe.adapters.crewai import replay_safe_tool
from crewai import Agent, Task, Crew

@replay_safe_tool(guard, type_str="DATABASE_UPDATE", target="user_upgrade")
def upgrade_user_db(user_id: str):
    # Perform database logic here
    return "User upgraded"

# Use the decorated function as a custom tool in your CrewAI agent
agent = Agent(
    role="DB Administrator",
    goal="Upgrade database entries",
    backstory="Expert at running DB updates",
    tools=[upgrade_user_db],
)
```

### LangChain Integration

Protect LangChain nodes and tool executions from repeating side effects:

```python
from replaysafe.adapters.langchain import replay_safe_langchain_tool

@replay_safe_langchain_tool(guard, type_str="SEND_EMAIL", target="welcome_email")
def send_email_tool(to_email: str):
    # Call email API
    return "Email sent"
```

---

## Features

- **Object Hash Parity**: Leverages recursive dictionary sorting and hashing matching the Node.js SDK to ensure cross-agent conflict detection works across mixed JS and Python environments.
- **Network Resilience**: Automatic exponential backoff and jittered retries to absorb transient SDK-to-server connection drops.
- **Safety Fail Policy**: Configure `"OPEN"` (default) to run operations even if the Replaysafe API is offline, or `"CLOSED"` to throw exceptions and fail-safe.
