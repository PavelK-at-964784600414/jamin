#!/bin/bash

# Safari Production Mode Startup Script
# Ensures proper environment setup for Safari compatibility

echo "🍎 Starting Jamin in Safari-compatible production mode..."

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Clear any existing cache that might cause issues
rm -rf .next/cache

# Start the server with Safari-compatible settings
echo "🚀 Starting production server on http://localhost:3000"
echo "📱 Safari users: Use http://localhost:3000 (not https://)"
echo ""

# Use plain HTTP to avoid SSL certificate issues in Safari
node_modules/.bin/next start -p 3000 --hostname localhost
