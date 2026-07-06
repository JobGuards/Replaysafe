# @replaysafe/cli

> The Infrastructure Safety Layer in your terminal.

Replaysafe Sentinel CLI is the official command-line interface for monitoring, guarding, and observing your infrastructure heartbeats.

## Installation

```bash
npm install -g @replaysafe/cli
```

## Getting Started

1. **Login** with your API Key:

   ```bash
   Replaysafe login <your-api-key>
   ```

2. **Send a Heartbeat** manually:

   ```bash
   Replaysafe hb <monitor-token>
   ```

3. **Monitor a Tunnel** (Latency + Handshake):

   ```bash
   Replaysafe tunnel monitor <monitor-token> --target 8.8.8.8 --interval 60
   ```

4. **Check ReplayGuard Status**:

   ```bash
   Replaysafe guard status <execution-id>
   ```

5. **View Activity Logs**:

   ```bash
   Replaysafe logs --limit 10
   ```

6. **Manage Monitors**:
   ```bash
   # List all monitors
   Replaysafe monitor list

   # Add a new Tunnel monitor (as seen in docs)
   Replaysafe monitor add --type tunnel --name "HQ-Office-VPN" --threshold 180s

   # Delete a monitor
   Replaysafe monitor delete <monitor-id>
   ```

## Features

- **Heartbeat Pulses**: Simple CLI pings to keep your monitors alive.
- **Tunnelight Engine**: Continuous latency and handshake monitoring for secure tunnels.
- **ReplayGuard Observation**: Inspect guarded execution status and side effects.
- **Secure Configuration**: Uses standard OS-level config stores to keep your keys safe.

## License

MIT
