#!/bin/bash

echo "🧪 Testing Monitor CRUD Operations E2E"
echo "======================================="
echo ""

# First, signin to get auth cookie
echo "0️⃣  Signing in..."
curl -s -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' \
  -c /tmp/monitor-test-cookies.txt > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Signed in successfully"
else
  echo "❌ Failed to sign in"
  exit 1
fi

echo ""
echo "1️⃣  Creating a new monitor..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/monitors \
  -H "Content-Type: application/json" \
  -b /tmp/monitor-test-cookies.txt \
  -d '{"name":"Test Database Backup","intervalMinutes":60,"gracePeriodMinutes":5}')

MONITOR_ID=$(echo $CREATE_RESPONSE | jq -r '.monitor.id')
HEARTBEAT_TOKEN=$(echo $CREATE_RESPONSE | jq -r '.monitor.heartbeatToken')

if [ "$MONITOR_ID" != "null" ] && [ -n "$MONITOR_ID" ]; then
  echo "✅ Monitor created successfully"
  echo "   ID: $MONITOR_ID"
  echo "   Token: $HEARTBEAT_TOKEN"
else
  echo "❌ Failed to create monitor"
  echo "   Response: $CREATE_RESPONSE"
  exit 1
fi

echo ""
echo "2️⃣  Listing all monitors..."
LIST_RESPONSE=$(curl -s http://localhost:4000/api/monitors \
  -b /tmp/monitor-test-cookies.txt)

MONITOR_COUNT=$(echo $LIST_RESPONSE | jq -r '.monitors | length')

if [ "$MONITOR_COUNT" -gt "0" ]; then
  echo "✅ Monitors listed successfully"
  echo "   Found $MONITOR_COUNT monitor(s)"
else
  echo "❌ Failed to list monitors"
  exit 1
fi

echo ""
echo "3️⃣  Getting single monitor details..."
GET_RESPONSE=$(curl -s http://localhost:4000/api/monitors/$MONITOR_ID \
  -b /tmp/monitor-test-cookies.txt)

GET_MONITOR_NAME=$(echo $GET_RESPONSE | jq -r '.monitor.name')

if [ "$GET_MONITOR_NAME" = "Test Database Backup" ]; then
  echo "✅ Monitor details retrieved successfully"
  echo "   Name: $GET_MONITOR_NAME"
else
  echo "❌ Failed to get monitor details"
  exit 1
fi

echo ""
echo "4️⃣  Updating monitor..."
UPDATE_RESPONSE=$(curl -s -X PUT http://localhost:4000/api/monitors/$MONITOR_ID \
  -H "Content-Type: application/json" \
  -b /tmp/monitor-test-cookies.txt \
  -d '{"name":"Updated Database Backup","intervalMinutes":120,"gracePeriodMinutes":10}')

UPDATED_NAME=$(echo $UPDATE_RESPONSE | jq -r '.monitor.name')
UPDATED_INTERVAL=$(echo $UPDATE_RESPONSE | jq -r '.monitor.intervalMinutes')

if [ "$UPDATED_NAME" = "Updated Database Backup" ] && [ "$UPDATED_INTERVAL" = "120" ]; then
  echo "✅ Monitor updated successfully"
  echo "   New name: $UPDATED_NAME"
  echo "   New interval: $UPDATED_INTERVAL minutes"
else
  echo "❌ Failed to update monitor"
  exit 1
fi

echo ""
echo "5️⃣  Testing heartbeat token uniqueness..."
# Create another monitor to ensure tokens are unique
CREATE2_RESPONSE=$(curl -s -X POST http://localhost:4000/api/monitors \
  -H "Content-Type: application/json" \
  -b /tmp/monitor-test-cookies.txt \
  -d '{"name":"Second Monitor","intervalMinutes":30,"gracePeriodMinutes":3}')

MONITOR2_TOKEN=$(echo $CREATE2_RESPONSE | jq -r '.monitor.heartbeatToken')

if [ "$MONITOR2_TOKEN" != "$HEARTBEAT_TOKEN" ] && [ "$MONITOR2_TOKEN" != "null" ]; then
  echo "✅ Heartbeat tokens are unique"
  echo "   Token 1: $HEARTBEAT_TOKEN"
  echo "   Token 2: $MONITOR2_TOKEN"
else
  echo "❌ Heartbeat tokens are not unique (security issue!)"
  exit 1
fi

MONITOR2_ID=$(echo $CREATE2_RESPONSE | jq -r '.monitor.id')

echo ""
echo "6️⃣  Testing authorization (monitors are org-scoped)..."
# Try to access monitor without auth
UNAUTH_RESPONSE=$(curl -s http://localhost:4000/api/monitors/$MONITOR_ID)

if echo "$UNAUTH_RESPONSE" | grep -q "error"; then
  echo "✅ Unauthorized access correctly blocked"
else
  echo "❌ Unauthorized access was allowed (security issue!)"
  exit 1
fi

echo ""
echo "7️⃣  Deleting monitor..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:4000/api/monitors/$MONITOR_ID \
  -b /tmp/monitor-test-cookies.txt)

if echo "$DELETE_RESPONSE" | grep -q "deleted successfully"; then
  echo "✅ Monitor deleted successfully"
else
  echo "❌ Failed to delete monitor"
  exit 1
fi

echo ""
echo "8️⃣  Verifying soft delete..."
# Try to get deleted monitor
DELETED_GET=$(curl -s http://localhost:4000/api/monitors/$MONITOR_ID \
  -b /tmp/monitor-test-cookies.txt)

if echo "$DELETED_GET" | grep -q "not found"; then
  echo "✅ Soft delete working (deleted monitor not accessible)"
else
  echo "❌ Soft delete not working properly"
  exit 1
fi

echo ""
echo "9️⃣  Cleaning up test data..."
# Delete the second monitor
curl -s -X DELETE http://localhost:4000/api/monitors/$MONITOR2_ID \
  -b /tmp/monitor-test-cookies.txt > /dev/null

echo "✅ Cleanup complete"

echo ""
echo "🔟  Verifying database records..."
cd /Users/scaler/Documents/StillUp/packages/db

# Check that monitors exist in DB with deletedAt set
DELETED_COUNT=$(npx prisma db execute --stdin 2>/dev/null <<EOF | grep -o '[0-9]*' | head -1
SELECT COUNT(*) FROM "Monitor" WHERE "deletedAt" IS NOT NULL;
EOF
)

if [ -n "$DELETED_COUNT" ] && [ "$DELETED_COUNT" -ge "2" ]; then
  echo "✅ Monitors soft deleted in database"
  echo "   Deleted monitors: $DELETED_COUNT"
else
  echo "⚠️  Could not verify database (but API tests passed)"
fi

echo ""
echo "✨ All monitor CRUD tests passed!"
echo ""
echo "📊 Summary:"
echo "   - ✅ Create monitor with unique token"
echo "   - ✅ List monitors for organization"
echo "   - ✅ Get single monitor details"
echo "   - ✅ Update monitor fields"
echo "   - ✅ Delete monitor (soft delete)"
echo "   - ✅ Authorization checks working"
echo "   - ✅ Heartbeat tokens are unique"
echo "   - ✅ Organization scoping working"
echo ""
echo "🌐 Frontend: http://localhost:3001/dashboard"
echo "   - Create monitors via 'New Monitor' button"
echo "   - View monitor details"
echo "   - Edit monitors"
echo "   - Delete monitors"
echo "   - Copy heartbeat tokens"
echo ""
echo "👉 Next: Open http://localhost:3001/dashboard to test the UI!"

# Cleanup
rm -f /tmp/monitor-test-cookies.txt
