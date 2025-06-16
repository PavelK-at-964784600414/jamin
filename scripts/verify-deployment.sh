#!/bin/bash

# Post-deployment verification script
# Usage: ./scripts/verify-deployment.sh [deployment-url]

echo "🚀 Vercel Deployment Verification Script"
echo "========================================"

DEPLOYMENT_URL=${1:-"https://your-app.vercel.app"}

echo "📋 Checking deployment at: $DEPLOYMENT_URL"
echo ""

# Test 1: Basic deployment health
echo "🏥 Testing basic deployment health..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Deployment is live and responding (HTTP $HTTP_STATUS)"
else
    echo "❌ Deployment issue (HTTP $HTTP_STATUS)"
fi

# Test 2: Check if JavaScript is loading
echo ""
echo "🔧 Testing JavaScript functionality..."
JS_TEST=$(curl -s "$DEPLOYMENT_URL" | grep -c "script" || echo "0")

if [ "$JS_TEST" -gt "0" ]; then
    echo "✅ JavaScript resources found in HTML ($JS_TEST script tags)"
else
    echo "⚠️  No script tags found - may indicate build issues"
fi

# Test 3: Test API endpoints
echo ""
echo "🔗 Testing API endpoints..."

# Test auth endpoint
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/auth/providers" || echo "000")
if [ "$AUTH_STATUS" = "200" ]; then
    echo "✅ Auth API responding (HTTP $AUTH_STATUS)"
else
    echo "❌ Auth API issue (HTTP $AUTH_STATUS)"
fi

# Test themes endpoint
THEMES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/themes" || echo "000")
if [ "$THEMES_STATUS" = "200" ] || [ "$THEMES_STATUS" = "401" ]; then
    echo "✅ Themes API responding (HTTP $THEMES_STATUS)"
else
    echo "❌ Themes API issue (HTTP $THEMES_STATUS)"
fi

# Test 4: Check for Edge Runtime issues
echo ""
echo "⚡ Testing Edge Runtime compatibility..."
SAFARI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/safari-diagnostic" || echo "000")

if [ "$SAFARI_STATUS" = "200" ]; then
    echo "✅ Safari diagnostic page accessible"
else
    echo "❌ Safari diagnostic page issue (HTTP $SAFARI_STATUS)"
fi

echo ""
echo "📊 Deployment Verification Summary"
echo "=================================="

# Count successful tests
TESTS_PASSED=0
[ "$HTTP_STATUS" = "200" ] && ((TESTS_PASSED++))
[ "$JS_TEST" -gt "0" ] && ((TESTS_PASSED++))
[ "$AUTH_STATUS" = "200" ] && ((TESTS_PASSED++))
[ "$THEMES_STATUS" = "200" ] || [ "$THEMES_STATUS" = "401" ] && ((TESTS_PASSED++))
[ "$SAFARI_STATUS" = "200" ] && ((TESTS_PASSED++))

echo "Tests passed: $TESTS_PASSED/5"

if [ "$TESTS_PASSED" -ge "4" ]; then
    echo "🎉 Deployment verification SUCCESSFUL!"
    echo ""
    echo "🔍 Next steps:"
    echo "   1. Test audio recording functionality"
    echo "   2. Test theme creation and layer addition"
    echo "   3. Verify ffmpeg mixing works (check logs if issues)"
    echo "   4. Test Safari compatibility manually"
else
    echo "⚠️  Deployment verification shows issues"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check Vercel deployment logs"
    echo "   2. Run: node scripts/debug-ffmpeg.js"
    echo "   3. Review DEPLOYMENT-STATUS.md"
    echo "   4. Check browser console for JavaScript errors"
fi

echo ""
echo "📚 Resources:"
echo "   - Deployment Status: DEPLOYMENT-STATUS.md"
echo "   - Debug Script: node scripts/debug-ffmpeg.js"
echo "   - Vercel Logs: vercel logs [deployment-url]"
