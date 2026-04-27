#!/bin/bash

echo "🧪 Testing Ownly Production API..."
echo ""

echo "1️⃣ Health Check:"
curl -s https://ownly-api.onrender.com/health | jq .
echo ""
echo ""

echo "2️⃣ Test WITHOUT API Key (should return 401):"
curl -s https://ownly-api.onrender.com/api/identity/test@example.com | jq .
echo ""
echo ""

echo "3️⃣ Test WITH API Key (should return 200):"
curl -s -X GET "https://ownly-api.onrender.com/api/identity/test@example.com" \
  -H "Authorization: Bearer ownly_18ab0bc16ca54b7aa170ca0b4092a62e" | jq .
echo ""
echo ""

echo "✅ Tests completed!"
