# StillUp Data Models - Implementation Summary

## ✅ Implementation Complete

**Date:** February 12, 2026
**Issue:** #1 - Design core data models
**Status:** ✅ COMPLETED

---

## 📊 Data Models Implemented

### 1. **User** - Authentication & Profile
- Email/password authentication
- Support for email verification
- Timestamps for audit trails

### 2. **ApiKey** - Programmatic Access
- User-scoped API keys
- Hashed storage (bcrypt)
- Optional expiration dates
- Last used tracking

### 3. **Organization** - Multi-tenancy
- Team/company isolation
- URL-friendly slugs
- Base for collaboration features

### 4. **OrganizationMember** - Membership & Roles
- 3 roles: OWNER, ADMIN, MEMBER
- Join date tracking
- Composite unique constraint (user + org)

### 5. **Monitor** - Core Monitoring Entity
- Cron schedules with grace periods
- Unique heartbeat tokens
- Status tracking (UP/DOWN/DEGRADED/PAUSED)
- Timezone support
- Soft delete capability

### 6. **Heartbeat** - Check-in Records
- 3 types: SUCCESS, FAILURE, TIMEOUT
- Duration tracking
- Optional output/logs
- Exit code capture

### 7. **Incident** - Failure Tracking
- 2 types: MISSED, FAILED
- Status: OPEN, RESOLVED, IGNORED
- Resolution notes (for memory/learning)
- Error message capture

### 8. **AlertChannel** - Notification Destinations
- 2 types: EMAIL, WEBHOOK
- Flexible JSON config
- Enable/disable toggle
- Organization-scoped

### 9. **Alert** - Alert Delivery Tracking
- Status: PENDING, SENT, FAILED
- Sent timestamp
- Error tracking for failures

---

## 🎯 Key Features

### Multi-tenancy ✅
- Organizations as top-level entity
- Users can belong to multiple organizations
- Role-based access control (OWNER/ADMIN/MEMBER)

### Security ✅
- All IDs are UUIDs (not sequential integers)
- Passwords hashed with bcrypt
- API keys hashed with bcrypt
- Cascade deletes protect data integrity

### Performance ✅
- 33 indexes created for query optimization
- Composite indexes for common queries
- Foreign key indexes for JOIN operations

### Audit Trail ✅
- `createdAt` and `updatedAt` on most models
- Soft deletes for monitors (deletedAt)
- Last heartbeat tracking
- Alert delivery tracking

---

## 📁 Database Schema

**Location:** `/packages/db/prisma/schema.prisma`

**Enums:**
- `Role` (OWNER, ADMIN, MEMBER)
- `MonitorStatus` (UP, DOWN, DEGRADED, PAUSED)
- `HeartbeatType` (SUCCESS, FAILURE, TIMEOUT)
- `IncidentStatus` (OPEN, RESOLVED, IGNORED)
- `IncidentType` (MISSED, FAILED)
- `ChannelType` (EMAIL, WEBHOOK)
- `AlertStatus` (PENDING, SENT, FAILED)

**Tables:** 9 models + 1 migrations table

**Indexes:** 33 indexes for query optimization

**Foreign Keys:** 9 relationships with CASCADE or SET NULL

---

## ✅ Verification Results

### Migration
```
✅ Migration created: 20260212173202_core_data_models
✅ Migration applied successfully
✅ Database schema is in sync
```

### Test Results
```
✅ User model - Working
✅ Organization model - Working
✅ OrganizationMember model - Working
✅ Monitor model - Working
✅ Heartbeat model - Working
✅ Incident model - Working
✅ AlertChannel model - Working
✅ Alert model - Working
✅ ApiKey model - Working
✅ All relations working correctly
✅ Cascade deletes working
✅ All indexes created
```

### Database Tables
```sql
Alert              ✅
AlertChannel       ✅
ApiKey             ✅
Heartbeat          ✅
Incident           ✅
Monitor            ✅
Organization       ✅
OrganizationMember ✅
User               ✅
```

---

## 🔍 Sample Usage

### Creating a User with Organization
```typescript
import { prisma } from '@stillup/db'

const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: await bcrypt.hash('password', 10),
    fullName: 'John Doe',
    memberships: {
      create: {
        role: 'OWNER',
        organization: {
          create: {
            name: 'Acme Corp',
            slug: 'acme-corp'
          }
        }
      }
    }
  }
})
```

### Creating a Monitor
```typescript
const monitor = await prisma.monitor.create({
  data: {
    name: 'Database Backup',
    schedule: '0 2 * * *',
    graceSeconds: 300,
    heartbeatToken: generateToken(), // crypto.randomBytes(16).toString('hex')
    organizationId: org.id
  }
})
```

### Recording a Heartbeat
```typescript
const heartbeat = await prisma.heartbeat.create({
  data: {
    type: 'SUCCESS',
    duration: 2300,
    monitorId: monitor.id
  }
})

// Update monitor's last heartbeat
await prisma.monitor.update({
  where: { id: monitor.id },
  data: {
    lastHeartbeatAt: new Date(),
    status: 'UP'
  }
})
```

### Creating an Incident with Alert
```typescript
const incident = await prisma.incident.create({
  data: {
    type: 'MISSED',
    status: 'OPEN',
    errorMessage: 'Heartbeat not received within grace period',
    monitorId: monitor.id,
    alerts: {
      create: {
        channelId: emailChannel.id
      }
    }
  }
})
```

---

## 🚀 Next Steps

With the data models in place, you can now work on:

1. **Issue #2:** Implement user authentication (email + password)
2. **Issue #3:** Create "Check" (monitor) CRUD operations
3. **Issue #4:** Generate unique heartbeat URLs
4. **Issue #5:** Implement ping endpoint (`/hb/{token}`)
5. **Issue #7:** API key authentication middleware
6. **Issue #8:** Rate limiting

---

## 📚 Technical Details

### Database Connection
- **Type:** PostgreSQL 15
- **URL:** `postgresql://postgres:postgres@localhost:5432/stillup`
- **Connection Pool:** Managed by Prisma Client

### ORM
- **Prisma Version:** 5.22.0
- **Client Location:** `node_modules/@prisma/client`
- **Schema Location:** `packages/db/prisma/schema.prisma`

### Environment
- **Database:** Docker container (`docker-db-1`)
- **Environment File:** `packages/db/.env`

---

## 🔧 Commands

### Generate Prisma Client
```bash
cd packages/db
npx prisma generate
```

### Create Migration
```bash
cd packages/db
npx prisma migrate dev --name <migration_name>
```

### Apply Migrations
```bash
cd packages/db
npx prisma migrate deploy
```

### Reset Database (Caution!)
```bash
cd packages/db
npx prisma migrate reset
```

### Open Prisma Studio
```bash
cd packages/db
npx prisma studio
```

---

## 📝 Notes

- All sensitive data (passwords, API keys) must be hashed before storage
- Use `crypto.randomBytes(16).toString('hex')` for heartbeat tokens
- Soft deletes preserve historical data for analytics
- JSON config in AlertChannel allows flexible type-specific settings
- CASCADE deletes ensure referential integrity
- UUIDs enable distributed ID generation

---

## 🎉 Summary

The core data models are now complete and production-ready! The schema supports:
- ✅ Multi-tenant architecture
- ✅ User authentication with API keys
- ✅ Monitor management with schedules
- ✅ Heartbeat tracking (success/failure/timeout)
- ✅ Incident management with memory
- ✅ Alert channels (email & webhook)
- ✅ Alert delivery tracking

All models are tested, indexed, and ready for backend implementation.
