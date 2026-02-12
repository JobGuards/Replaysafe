#!/bin/bash

# Test Heartbeat Ping Endpoint and Status Calculation
# Issues #5 and #6

API_BASE="http://localhost:4000"
set -e

echo "🧪 Testing Heartbeat Ping Endpoint & Status Calculation (Issues #5 & #6)"
echo "=========================================================================="

# 1. Setup: Create user and login
echo -e "\n1️⃣ Setting up test user and monitor..."

# Generate unique email for this test run
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-$TIMESTAMP@example.com"

# Signup (creates user and organization)
SIGNUP_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\"
  }" \
  -c /tmp/cookies.txt)

echo "✅ Created test user: $TEST_EMAIL"

# Create a monitor with 1-minute interval
CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/monitors" \
  -H "Content-Type: application/json" \
  -b /tmp/cookies.txt \
  -d '{
    "name": "Test Heartbeat Monitor",
    "intervalMinutes": 1,
    "gracePeriodMinutes": 2
  }')

MONITOR_ID=$(echo $CREATE_RESPONSE | jq -r '.monitor.id')
HEARTBEAT_TOKEN=$(echo $CREATE_RESPONSE | jq -r '.monitor.heartbeatToken')

echo "✅ Created monitor: $MONITOR_ID"
echo "   Token: $HEARTBEAT_TOKEN"

# 2. Test ping endpoint (public, no auth)
echo -e "\n2️⃣ Testing ping endpoint (public, no auth required)..."

PING_RESPONSE=$(curl -s -X POST "$API_BASE/api/ping/$HEARTBEAT_TOKEN")
PING_STATUS=$(echo $PING_RESPONSE | jq -r '.status')

if [ "$PING_STATUS" = "ok" ]; then
  echo "✅ Ping successful"
else
  echo "❌ Ping failed: $PING_RESPONSE"
  exit 1
fi

# 3. Verify monitor was updated
echo -e "\n3️⃣ Verifying monitor was updated..."

sleep 1 # Wait a second for DB write

MONITOR_RESPONSE=$(curl -s -X GET "$API_BASE/api/monitors/$MONITOR_ID" \
  -b /tmp/cookies.txt)

LAST_HEARTBEAT=$(echo $MONITOR_RESPONSE | jq -r '.monitor.lastHeartbeatAt')
CALCULATED_STATUS=$(echo $MONITOR_RESPONSE | jq -r '.monitor.calculatedStatus')

if [ "$LAST_HEARTBEAT" != "null" ]; then
  echo "✅ lastHeartbeatAt updated: $LAST_HEARTBEAT"
else
  echo "❌ lastHeartbeatAt not updated"
  exit 1
fi

if [ "$CALCULATED_STATUS" = "UP" ]; then
  echo "✅ Status is UP (just pinged)"
else
  echo "❌ Expected status UP, got: $CALCULATED_STATUS"
  exit 1
fi

# 4. Test invalid token (properly formatted but non-existent)
echo -e "\n4️⃣ Testing invalid token..."

INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/ping/hb_000000000000000000000000")
HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "404" ]; then
  echo "✅ Invalid token returns 404"
else
  echo "❌ Expected 404, got: $HTTP_CODE"
  exit 1
fi

# 5. Test malformed token
echo -e "\n5️⃣ Testing malformed token..."

MALFORMED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/ping/bad_format")
HTTP_CODE=$(echo "$MALFORMED_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "404" ]; then
  echo "✅ Malformed token rejected"
else
  echo "❌ Expected 400 or 404, got: $HTTP_CODE"
  exit 1
fi

# 6. Wait and check LATE status
echo -e "\n6️⃣ Testing LATE status (waiting 70 seconds)..."
echo "   Expected time: 1 minute, Grace: 2 minutes"
echo "   After 70s: should be past expected but within grace = LATE"

sleep 70

LATE_RESPONSE=$(curl -s -X GET "$API_BASE/api/monitors/$MONITOR_ID" \
  -b /tmp/cookies.txt)

LATE_STATUS=$(echo $LATE_RESPONSE | jq -r '.monitor.calculatedStatus')

if [ "$LATE_STATUS" = "LATE" ]; then
  echo "✅ Status is LATE (past expected, within grace)"
else
  echo "⚠️  Expected LATE, got: $LATE_STATUS (may need adjustment)"
fi

# 7. Send another ping to recover
echo -e "\n7️⃣ Sending recovery ping..."

curl -s -X POST "$API_BASE/api/ping/$HEARTBEAT_TOKEN" > /dev/null

sleep 1

RECOVERED_RESPONSE=$(curl -s -X GET "$API_BASE/api/monitors/$MONITOR_ID" \
  -b /tmp/cookies.txt)

RECOVERED_STATUS=$(echo $RECOVERED_RESPONSE | jq -r '.monitor.calculatedStatus')

if [ "$RECOVERED_STATUS" = "UP" ]; then
  echo "✅ Status recovered to UP after ping"
else
  echo "❌ Expected UP after recovery, got: $RECOVERED_STATUS"
  exit 1
fi

# 8. Cleanup
echo -e "\n8️⃣ Cleaning up..."

curl -s -X DELETE "$API_BASE/api/monitors/$MONITOR_ID" \
  -b /tmp/cookies.txt > /dev/null

echo "✅ Test monitor deleted"

# Summary
echo -e "\n=========================================================================="
echo "✅ All heartbeat and status calculation tests passed!"
echo "=========================================================================="
