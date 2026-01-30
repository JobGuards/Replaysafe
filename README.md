# 🔔 StillUp

**If it didn't run, we tell you. If it failed, we remember.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Active-success)]()

---

## 🎯 What is StillUp?

StillUp is a **heartbeat monitoring service with memory**. It ensures your backups, cron jobs, and scheduled tasks actually run — and when they fail, it remembers what happened so you don't repeat the same mistakes.

### The Problem

Your critical jobs are failing silently:

```bash
0 2 * * * /usr/local/bin/backup-db.sh >/dev/null 2>&1
```

This backup script:
- ✅ Runs every night at 2 AM
- ✅ Exits with code 0
- ❌ **Silently fails when:**
  - Disk is full
  - Permissions changed
  - Credentials expired
  - Network is down
  - Target is unreachable

**You discover the failure only when you need to restore data.**

---

## ✨ The StillUp Solution

**Simple heartbeat monitoring:**

```bash
#!/bin/bash
# Run your backup
/usr/local/bin/backup-db.sh

# Tell StillUp it succeeded
curl https://stillup.io/hb/your-unique-token
```

**If the curl doesn't happen, you get alerted immediately.**

But StillUp goes further than traditional monitoring:

| Feature | Healthchecks | Uptime Kuma | **StillUp** |
|---------|--------------|-------------|-------------|
| Detects failures | ✅ | ✅ | ✅ |
| **Remembers failures** | ❌ | ❌ | ✅ |
| **Tracks resolution** | ❌ | ❌ | ✅ |
| **Learns patterns** | ❌ | ❌ | ✅ |
| **Suggests fixes** | ❌ | ❌ | ✅ |

---

## 🚀 Quick Start

### 1. Create a Monitor

Visit [app.stillup.io](https://app.stillup.io) and create your first monitor:

```
Name: Daily Database Backup
Schedule: Every day at 2 AM
Grace Period: 5 minutes
```

You'll get a unique heartbeat URL:
```
https://stillup.io/hb/abc123xyz789
```

### 2. Add Heartbeat to Your Script

**For successful completion:**
```bash
#!/bin/bash
set -e  # Exit on error

# Your backup logic
mysqldump -u root mydb > /backups/mydb.sql
aws s3 cp /backups/mydb.sql s3://my-bucket/

# Report success to StillUp
curl -fsS https://stillup.io/hb/abc123xyz789
```

**For failure reporting:**
```bash
#!/bin/bash

if ! /usr/local/bin/backup-db.sh; then
    # Report failure with details
    curl -X POST https://stillup.io/hb/abc123xyz789/fail \
         -d "exitCode=$?" \
         -d "output=Backup failed: $(tail -n 5 /var/log/backup.log)"
    exit 1
fi

# Report success
curl https://stillup.io/hb/abc123xyz789
```

### 3. Get Alerted When It Fails

StillUp will:
- ✅ Alert you if the heartbeat is missed
- ✅ Alert you if failure is explicitly reported
- ✅ Show you what went wrong
- ✅ Remember this failure for next time

---

## 🎨 Features

### 🫀 Heartbeat Monitoring
- **Zero config** - Just add a curl to your script
- **No agents** - Works anywhere curl works (Linux, macOS, Windows)
- **Flexible schedules** - Cron syntax or human-readable ("every 5 minutes")
- **Grace periods** - Allow scripts extra time to complete
- **Timezone support** - Respect local time for schedules

### 📊 Execution Memory
Unlike traditional monitoring, StillUp **remembers**:

- ✅ **Last failure** - "Failed 14 days ago with 'Disk full'"
- ✅ **Resolution notes** - "Fixed by: Increased disk space"
- ✅ **Failure patterns** - "Fails every Monday at 2 AM"
- ✅ **Similar incidents** - "3 similar failures in past month"
- ✅ **What worked** - "Resolved by restarting service"

### 🚨 Smart Alerting
- **Email alerts** - Instant notifications
- **Webhook alerts** - Integrate with Slack, Discord, PagerDuty
- **Alert consolidation** - Group related failures
- **Auto-resolution** - Mark resolved when heartbeat succeeds
- **Escalation** - Coming soon

### 📈 Analytics & Insights
- **Uptime tracking** - 30-day, 90-day, 12-month views
- **Health scores** - Single metric for monitor health
- **Pattern detection** - Identify recurring issues
- **Duration tracking** - Detect performance degradation
- **Failure trends** - Visualize failure distribution

### 🧠 Intelligence
StillUp learns from your failures:

- 🔍 **Pattern Detection** - "This job always fails on Mondays"
- 💡 **Suggested Fixes** - "Last time this was fixed by..."
- ⚠️ **Anomaly Detection** - "Usually takes 5s, now taking 50s"
- 🎯 **Incident Grouping** - "3 monitors failed at same time"
- 📝 **Resolution Search** - Find similar past incidents

---

## 🎯 Use Cases

### Database Backups

```bash
#!/bin/bash
# /usr/local/bin/backup-postgres.sh

set -eo pipefail

BACKUP_FILE="/backups/postgres-$(date +%Y%m%d).sql"
HEARTBEAT_URL="https://stillup.io/hb/db-backup-token"

# Perform backup
pg_dump -U postgres mydb > "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" s3://my-backups/

# Verify upload
aws s3 ls s3://my-backups/postgres-$(date +%Y%m%d).sql

# Cleanup old backups
find /backups -type f -mtime +7 -delete

# Report success
curl -fsS --retry 3 "$HEARTBEAT_URL"
```

### SSL Certificate Renewal

```bash
#!/bin/bash
# Auto-renew Let's Encrypt certificates

certbot renew --quiet

if [ $? -eq 0 ]; then
    nginx -s reload
    curl https://stillup.io/hb/ssl-renewal-token
else
    curl -X POST https://stillup.io/hb/ssl-renewal-token/fail \
         -d "output=Certificate renewal failed"
fi
```

### Data Sync Jobs

```bash
#!/bin/bash
# Sync customer data from CRM to warehouse

python /opt/sync/crm_sync.py

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    curl https://stillup.io/hb/crm-sync-token
else
    ERROR_LOG=$(tail -n 10 /var/log/crm_sync.log)
    curl -X POST https://stillup.io/hb/crm-sync-token/fail \
         -H "Content-Type: application/json" \
         -d "{\"exitCode\": $EXIT_CODE, \"output\": \"$ERROR_LOG\"}"
fi
```

### Health Checks for Services

```bash
#!/bin/bash
# Check if critical service is responsive

if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    curl https://stillup.io/hb/app-health-token
else
    curl https://stillup.io/hb/app-health-token/fail
fi
```

### Scheduled Reports

```bash
#!/bin/bash
# Generate and email daily sales report

python /opt/reports/daily_sales.py

if [ $? -eq 0 ]; then
    /usr/sbin/sendmail -t < /tmp/sales_report.txt
    curl https://stillup.io/hb/daily-report-token
fi
```

---

## 📚 API Reference

### Heartbeat Endpoints

#### Report Success

```bash
# Simple GET request
curl https://stillup.io/hb/{token}

# POST with metadata
curl -X POST https://stillup.io/hb/{token} \
     -H "Content-Type: application/json" \
     -d '{
       "duration": 12500,
       "output": "Backup completed: 1.2GB"
     }'
```

**Response:** `200 OK`

#### Report Failure

```bash
# Simple GET request
curl https://stillup.io/hb/{token}/fail

# POST with details
curl -X POST https://stillup.io/hb/{token}/fail \
     -H "Content-Type: application/json" \
     -d '{
       "exitCode": 1,
       "output": "Error: Permission denied",
       "duration": 1200
     }'
```

**Response:** `200 OK`

### Management API

All management endpoints require authentication with `X-API-Key` header.

#### List Monitors

```bash
curl -H "X-API-Key: your-api-key" \
     https://api.stillup.io/monitors
```

**Response:**
```json
{
  "monitors": [
    {
      "id": "mon_abc123",
      "name": "Daily Backup",
      "schedule": "0 2 * * *",
      "status": "up",
      "lastHeartbeat": "2025-01-31T02:00:15Z"
    }
  ]
}
```

#### Create Monitor

```bash
curl -X POST https://api.stillup.io/monitors \
     -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Daily Backup",
       "schedule": "0 2 * * *",
       "graceSeconds": 300
     }'
```

**Response:**
```json
{
  "id": "mon_abc123",
  "heartbeatUrl": "https://stillup.io/hb/abc123xyz789"
}
```

#### Get Monitor Details

```bash
curl -H "X-API-Key: your-api-key" \
     https://api.stillup.io/monitors/mon_abc123
```

---

## 🔧 Advanced Configuration

### Custom Schedule Formats

**Cron expressions:**
```
0 2 * * *        # Daily at 2 AM
*/15 * * * *     # Every 15 minutes
0 0 * * 0        # Weekly on Sunday midnight
0 9 1 * *        # Monthly on 1st at 9 AM
```

**Human-readable:**
```
every 5 minutes
every hour
every day at 2am
every monday at 9am
every 1st of month
```

### Grace Periods

Grace period is the extra time allowed after the expected heartbeat before alerting.

**Examples:**
- **Quick jobs** (< 1 min): Grace = 60 seconds
- **Backups** (5-10 min): Grace = 300 seconds (5 min)
- **Long jobs** (30+ min): Grace = 600 seconds (10 min)

### Alert Configuration

#### Email Alerts

Configure in dashboard under **Settings → Alerts**:

```
Email: ops@company.com
Notify on: Incidents and Resolutions
```

#### Webhook Alerts

```bash
# Add webhook endpoint
curl -X POST https://api.stillup.io/alert-channels \
     -H "X-API-Key: your-api-key" \
     -d '{
       "type": "webhook",
       "url": "https://your-webhook.com/stillup",
       "events": ["incident.created", "incident.resolved"]
     }'
```

**Webhook Payload:**
```json
{
  "event": "incident.created",
  "timestamp": "2025-01-31T10:00:00Z",
  "monitor": {
    "id": "mon_abc123",
    "name": "Daily Backup"
  },
  "incident": {
    "id": "inc_xyz789",
    "type": "missed",
    "startedAt": "2025-01-31T02:05:00Z"
  }
}
```

---

## 🖥️ Dashboard

Access your dashboard at [app.stillup.io](https://app.stillup.io)

### Features

**Monitor Overview:**
- See all monitors at a glance
- Real-time status indicators
- Last heartbeat times
- Health scores

**Monitor Details:**
- Heartbeat timeline (last 100 heartbeats)
- Uptime statistics
- Failure history
- Resolution notes

**Incidents:**
- Open and resolved incidents
- Failure patterns
- Resolution search
- Manual resolution

**Analytics:**
- Uptime trends over time
- Failure distribution by monitor
- Duration trends
- Health score history

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + Express
- PostgreSQL (via Prisma ORM)
- Redis (rate limiting & caching)
- Cron workers (background jobs)

**Frontend:**
- Next.js 14 (App Router)
- Tailwind CSS
- Recharts (analytics)
- SWR (data fetching)

**Infrastructure:**
- Vercel (API & Dashboard)
- Neon/Supabase (Database)
- Upstash (Redis)
- Resend (Email)

---

## 🔒 Security & Privacy

### Data Security
- ✅ All API communication over HTTPS
- ✅ API keys hashed with bcrypt
- ✅ Rate limiting on all endpoints
- ✅ Input validation on all requests
- ✅ SQL injection prevention

### Data Retention
- Heartbeat records: **30 days** (configurable)
- Incident records: **Forever** (for learning)
- Aggregated statistics: **Forever**
- Resolution notes: **Forever**

### Privacy
- We **never** log script output unless you send it
- Heartbeat tokens are cryptographically random
- Data isolated per project
- Optional: self-hosted deployment

---

## 🤝 Integrations

### Alerting Platforms
- **Slack** - Send incidents to Slack channels
- **Discord** - Notify Discord servers
- **PagerDuty** - Create incidents in PagerDuty
- **Microsoft Teams** - Post to Teams channels
- **Telegram** - Send Telegram messages
- **Webhooks** - Custom integrations

### Monitoring Tools
- **Datadog** - Forward events to Datadog
- **Grafana** - Import StillUp metrics
- **Prometheus** - Scrape metrics endpoint

### CI/CD
- **GitHub Actions** - Monitor workflow runs
- **GitLab CI** - Monitor pipeline executions
- **Jenkins** - Monitor build jobs

---

## 🚀 Self-Hosting

StillUp can be self-hosted for complete control over your data.

### Docker Compose Setup

```bash
# Clone repository
git clone https://github.com/yourusername/stillup.git
cd stillup

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start services
docker-compose up -d
```

**Services started:**
- API server (port 3000)
- Dashboard (port 3001)
- PostgreSQL database
- Redis cache
- Background workers

### Requirements
- Docker & Docker Compose
- 2GB RAM minimum
- 10GB disk space

See [self-hosting guide](./docs/self-hosting.md) for details.

---

## 🧪 Development

### Local Setup

```bash
# Clone repository
git clone https://github.com/yourusername/stillup.git
cd stillup

# Install dependencies
npm install

# Start local database
docker-compose up -d postgres redis

# Run migrations
cd apps/api
npx prisma migrate dev

# Start development servers
cd ../..
npm dev
```

**Running services:**
- API: http://localhost:3000
- Dashboard: http://localhost:3001
- Docs: http://localhost:3002

### Testing

```bash
# Run all tests
npm test

# Run specific package tests
npm test --filter=api
npm test --filter=web

# Run with coverage
npm test:coverage
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md).

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Telegram alerts
fix: resolve timezone bug
docs: update API reference
test: add heartbeat tests
```

---


## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙋 Support

- 📚 **Documentation:** [docs.stillup.io](https://docs.stillup.io)
- 💬 **Discord:** [Join our community](https://discord.gg/stillup)
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/stillup/issues)
- 📧 **Email:** support@stillup.io
- 🐦 **Twitter:** [@stillup_io](https://twitter.com/stillup_io)

---


## 🎯 Our Philosophy

**1. Memory Over Monitoring**
> "Those who cannot remember the past are condemned to repeat it."

Traditional monitoring tells you *what* failed. StillUp tells you what failed, *why* it matters, and *what worked last time*.

**2. Intelligence Over Alerts**
> "Alert me when something's wrong, but teach me so it never happens again."

StillUp doesn't just alert — it learns patterns, detects anomalies, and surfaces insights.

**3. Simplicity Over Features**
> "The best monitoring is the monitoring you actually use."

One curl. No agents. No complex configuration. Just works.

---

<div align="center">

**Made with ❤️ by developers tired of silent failures**

[Website](https://stillup.io) • [Dashboard](https://app.stillup.io) • [Documentation](https://docs.stillup.io) • [Discord](https://discord.gg/stillup)

⭐ Star us on GitHub if StillUp helped you catch a silent failure!

</div>