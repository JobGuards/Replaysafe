#!/bin/bash

echo "🧪 Testing Authentication Flow E2E"
echo "===================================="
echo ""

# Generate random email for testing
RANDOM_EMAIL="test$(date +%s)@example.com"
PASSWORD="TestPass123"
FULL_NAME="Test User"

echo "1️⃣  Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\",\"fullName\":\"$FULL_NAME\"}" \
  -c /tmp/auth-test-cookies.txt)

if echo "$SIGNUP_RESPONSE" | grep -q "user"; then
  echo "✅ Signup successful"
  echo "   Email: $RANDOM_EMAIL"
  echo "   Response: $(echo $SIGNUP_RESPONSE | jq -r '.user.email')"
else
  echo "❌ Signup failed"
  echo "   Response: $SIGNUP_RESPONSE"
  exit 1
fi

echo ""
echo "2️⃣  Testing Signin with correct credentials..."
SIGNIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"$PASSWORD\"}" \
  -c /tmp/auth-test-cookies.txt)

if echo "$SIGNIN_RESPONSE" | grep -q "user"; then
  echo "✅ Signin successful"
  echo "   Organizations: $(echo $SIGNIN_RESPONSE | jq -r '.organizations | length')"
else
  echo "❌ Signin failed"
  echo "   Response: $SIGNIN_RESPONSE"
  exit 1
fi

echo ""
echo "3️⃣  Testing signin with wrong password..."
WRONG_SIGNIN=$(curl -s -X POST http://localhost:4000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$RANDOM_EMAIL\",\"password\":\"WrongPassword\"}")

if echo "$WRONG_SIGNIN" | grep -q "error"; then
  echo "✅ Wrong password correctly rejected"
else
  echo "❌ Wrong password was accepted (security issue!)"
  exit 1
fi

echo ""
echo "4️⃣  Testing protected route /me with cookie..."
ME_RESPONSE=$(curl -s http://localhost:4000/api/auth/me -b /tmp/auth-test-cookies.txt)

if echo "$ME_RESPONSE" | grep -q "user"; then
  echo "✅ Protected route works with cookie"
  echo "   User: $(echo $ME_RESPONSE | jq -r '.user.fullName')"
else
  echo "❌ Protected route failed"
  echo "   Response: $ME_RESPONSE"
  exit 1
fi

echo ""
echo "5️⃣  Testing protected route without cookie..."
NO_AUTH_RESPONSE=$(curl -s http://localhost:4000/api/auth/me)

if echo "$NO_AUTH_RESPONSE" | grep -q "error"; then
  echo "✅ Protected route correctly rejects unauthenticated requests"
else
  echo "❌ Protected route allowed unauthenticated access (security issue!)"
  exit 1
fi

echo ""
echo "6️⃣  Testing signout..."
SIGNOUT_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/signout \
  -b /tmp/auth-test-cookies.txt \
  -c /tmp/auth-test-cookies.txt)

if echo "$SIGNOUT_RESPONSE" | grep -q "Signed out"; then
  echo "✅ Signout successful"
else
  echo "❌ Signout failed"
  exit 1
fi

echo ""
echo "7️⃣  Testing that cookie is cleared after signout..."
AFTER_SIGNOUT=$(curl -s http://localhost:4000/api/auth/me -b /tmp/auth-test-cookies.txt)

if echo "$AFTER_SIGNOUT" | grep -q "error"; then
  echo "✅ Cookie correctly cleared after signout"
else
  echo "❌ Cookie still valid after signout (security issue!)"
  exit 1
fi

echo ""
echo "8️⃣  Verifying data in database..."
cd /Users/scaler/Documents/StillUp/packages/db
USER_COUNT=$(npx prisma db execute --stdin <<EOF | grep -o '[0-9]*'
SELECT COUNT(*) FROM "User" WHERE email = '$RANDOM_EMAIL';
EOF
)

if [ "$USER_COUNT" -eq "1" ]; then
  echo "✅ User created in database"
else
  echo "❌ User not found in database"
  exit 1
fi

ORG_COUNT=$(npx prisma db execute --stdin <<EOF | grep -o '[0-9]*'
SELECT COUNT(*) FROM "Organization" o
INNER JOIN "OrganizationMember" om ON o.id = om."organizationId"
INNER JOIN "User" u ON om."userId" = u.id
WHERE u.email = '$RANDOM_EMAIL' AND om.role = 'OWNER';
EOF
)

if [ "$ORG_COUNT" -eq "1" ]; then
  echo "✅ Organization created and user is OWNER"
else
  echo "❌ Organization not properly set up"
  exit 1
fi

echo ""
echo "✨ All tests passed! Authentication system is working correctly."
echo ""
echo "📊 Summary:"
echo "   - ✅ User signup with organization creation"
echo "   - ✅ User signin with JWT cookies"
echo "   - ✅ Protected routes with authentication"
echo "   - ✅ User signout and cookie clearing"
echo "   - ✅ Invalid credentials rejected"
echo "   - ✅ Unauthenticated requests rejected"
echo "   - ✅ Database records created correctly"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔌 Backend:  http://localhost:4000"
echo ""
echo "👉 Next: Open http://localhost:3001/auth/signup in your browser to test the UI!"

# Cleanup
rm -f /tmp/auth-test-cookies.txt
