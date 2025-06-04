#!/bin/bash

# Safari HTTP-Only Production Server
# This script ensures Safari can't redirect to HTTPS

echo "🍎 Starting Safari-compatible HTTP-only server..."
echo "⚠️  IMPORTANT: Safari users must use http://localhost:3000"
echo ""

# Kill any existing Next.js servers
pkill -f "next start" || true

# Clear Next.js cache
rm -rf .next/cache

# Set environment for HTTP-only operation
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export DISABLE_HTTPS_REDIRECT=1

# Start server with explicit HTTP binding
echo "🚀 Server starting at http://localhost:3000"
echo "📋 For Safari diagnostic tool: http://localhost:3000/safari-diagnostic"
echo ""

# Start the server
node_modules/.bin/next start -p 3000 -H localhost --experimental-https=false
