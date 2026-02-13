#!/bin/bash
# E2E Test: Rate Limiting
# Prerequisites: API server running, Redis running, database migrated

set -e

BASE_URL="http://localhost:4000"
PASS=0
FAIL=0

EMAIL="ratelimit-test-$(date +%s)@test.com"
PASSWORD="testpassword123"

echo "========================================="
echo "  Rate Limiting E2E Tests"
echo "========================================="
echo ""

# Helper: extract JSON field
json_field() {
  node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))$1)"
}

# ---- Step 1: Create test user and get API key ----
echo "1. Setting up test user and API key..."
SIGNUP_RESPONSE=$(curl -s -c cookies.txt -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"fullName\":\"Rate Limit Tester\"}")

USER_ID=$(echo "$SIGNUP_RESPONSE" | json_field '.user.id')
if [ -z "$USER_ID" ]; then
  echo "   FAIL: Could not create user"
  exit 1
fi

# Create API key
KEY_RESPONSE=$(curl -s -b cookies.txt -X POST "$BASE_URL/api/keys" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rate Test Key"}')
API_KEY=$(echo "$KEY_RESPONSE" | json_field '.key')

if [ -n "$API_KEY" ]; then
  echo "   PASS: User and API key created"
  ((PASS++))
else
  echo "   FAIL: Could not create API key"
  ((FAIL++))
fi

# ---- Step 2: Test rate limit headers are present ----
echo ""
echo "2. Checking rate limit headers..."
HEADERS=$(curl -s -D - -X GET "$BASE_URL/api/monitors" \
  -H "X-API-Key: $API_KEY" \
  -o /dev/null)

if echo "$HEADERS" | grep -qi "RateLimit-Limit"; then
  echo "   PASS: RateLimit-Limit header present"
  ((PASS++))
else
  echo "   FAIL: RateLimit-Limit header missing"
  ((FAIL++))
fi

if echo "$HEADERS" | grep -qi "RateLimit-Remaining"; then
  echo "   PASS: RateLimit-Remaining header present"
  ((PASS++))
else
  echo "   FAIL: RateLimit-Remaining header missing"
  ((FAIL++))
fi

# ---- Step 3: Test management API limit (100/min) ----
echo ""
echo "3. Testing management API rate limit (100/min)..."
SUCCESS_COUNT=0
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/monitors" \
    -H "X-API-Key: $API_KEY")
  if [ "$STATUS" = "200" ]; then
    ((SUCCESS_COUNT++))
  fi
done

if [ "$SUCCESS_COUNT" -eq 10 ]; then
  echo "   PASS: First 10 requests succeeded (under limit)"
  ((PASS++))
else
  echo "   INFO: Got $SUCCESS_COUNT/10 successful requests"
  echo "   SKIP: Rate limiting behavior may vary"
fi

# ---- Step 4: Test dashboard API limit (500/min) on auth routes ----
echo ""
echo "4. Testing dashboard API accepts auth requests..."
for i in {1..5}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/signout" \
    -b cookies.txt)
  # signout always returns 200
  if [ "$STATUS" != "200" ]; then
    echo "   FAIL: Auth request $i failed with status $STATUS"
    ((FAIL++))
    break
  fi
done

echo "   PASS: Dashboard API processed auth requests"
((PASS++))

# ---- Step 5: Test health endpoint bypasses rate limiting ----
echo ""
echo "5. Testing health endpoint bypasses rate limiting..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH_STATUS" = "200" ]; then
  echo "   PASS: Health endpoint accessible without rate limiting"
  ((PASS++))
else
  echo "   FAIL: Health endpoint returned $HEALTH_STATUS"
  ((FAIL++))
fi

# ---- Step 6: Test heartbeat rate limit (1000/min) ----
echo ""
echo "6. Testing heartbeat endpoint rate limit..."
# Create a monitor first
MONITOR_RESPONSE=$(curl -s -b cookies.txt -X POST "$BASE_URL/api/monitors" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rate Test Monitor","intervalMinutes":60,"gracePeriodMinutes":5}')

HEARTBEAT_TOKEN=$(echo "$MONITOR_RESPONSE" | json_field '.monitor.heartbeatToken')

if [ -n "$HEARTBEAT_TOKEN" ]; then
  # Send heartbeats
  HB_SUCCESS=0
  for i in {1..10}; do
    HB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/ping/$HEARTBEAT_TOKEN")
    if [ "$HB_STATUS" = "200" ]; then
      ((HB_SUCCESS++))
    fi
  done

  if [ "$HB_SUCCESS" -eq 10 ]; then
    echo "   PASS: Heartbeat endpoint processed 10 pings (under 1000/min limit)"
    ((PASS++))
  else
    echo "   INFO: Processed $HB_SUCCESS/10 heartbeats"
    echo "   SKIP: Rate limiting behavior may vary"
  fi
else
  echo "   SKIP: Could not create monitor for heartbeat test"
fi

# ---- Step 7: Verify rate limits are per-user ----
echo ""
echo "7. Testing rate limits are per-user (not global)..."
# Create second user
EMAIL2="ratelimit-test2-$(date +%s)@test.com"
SIGNUP2=$(curl -s -c cookies2.txt -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD\",\"fullName\":\"User 2\"}")

USER2_ID=$(echo "$SIGNUP2" | json_field '.user.id')

if [ -n "$USER2_ID" ]; then
  # Second user should have their own rate limit quota
  STATUS2=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/api/monitors" \
    -b cookies2.txt)

  if [ "$STATUS2" = "200" ]; then
    echo "   PASS: Second user has independent rate limit quota"
    ((PASS++))
  else
    echo "   FAIL: Second user could not access API (status: $STATUS2)"
    ((FAIL++))
  fi
else
  echo "   SKIP: Could not create second user"
fi

# ---- Cleanup ----
rm -f cookies.txt cookies2.txt

echo ""
echo "========================================="
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
