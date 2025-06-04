#!/usr/bin/env node

/**
 * Safari Production Reset Script
 * Fixes HSTS cache issues and ensures HTTP-only operation for Safari
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍎 Safari Production Reset Script');
console.log('==================================\n');

function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return null;
  }
}

function clearSafariCache() {
  console.log('🧹 Clearing Safari caches and HSTS...');
  
  const instructions = `
To completely clear Safari's HSTS cache for localhost:

1. CLOSE SAFARI COMPLETELY
2. Open Terminal and run:
   rm -rf ~/Library/Caches/com.apple.Safari/
   rm -rf ~/Library/Safari/LocalStorage/
   rm -rf ~/Library/WebKit/

3. Alternative method:
   - Open Safari
   - Go to Develop → Empty Caches
   - Safari → Clear History and Website Data
   - Choose "All History"

4. Restart Safari and go directly to:
   http://localhost:3000/safari-diagnostic
   
   ⚠️  IMPORTANT: Type 'http://' manually - don't let Safari auto-complete!
`;

  console.log(instructions);
}

function createHTTPStartScript() {
  console.log('📝 Creating HTTP-only start script...');
  
  const script = `#!/bin/bash

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
`;

  fs.writeFileSync('./start-safari-http.sh', script);
  fs.chmodSync('./start-safari-http.sh', '755');
  console.log('✅ HTTP-only start script created: ./start-safari-http.sh');
}

function updatePackageJson() {
  console.log('📦 Adding Safari-specific npm scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'safari:reset': 'node scripts/safari-reset-production.js',
      'safari:start': './start-safari-http.sh',
      'safari:diagnostic': 'npm run safari:start && open http://localhost:3000/safari-diagnostic'
    };
    
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json updated with Safari scripts');
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
  }
}

function displaySafariInstructions() {
  console.log('\n🎯 SAFARI PRODUCTION MODE INSTRUCTIONS');
  console.log('=====================================\n');
  
  console.log('1. FIRST, clear Safari\'s HSTS cache:');
  console.log('   • Quit Safari completely');
  console.log('   • Run: rm -rf ~/Library/Caches/com.apple.Safari/');
  console.log('   • Or use Safari → Develop → Empty Caches');
  console.log('');
  
  console.log('2. START the HTTP-only server:');
  console.log('   npm run safari:start');
  console.log('');
  
  console.log('3. NAVIGATE in Safari to:');
  console.log('   http://localhost:3000/safari-diagnostic');
  console.log('   ⚠️  Type "http://" manually - don\'t use autocomplete!');
  console.log('');
  
  console.log('4. IF Safari still redirects to HTTPS:');
  console.log('   • Type "http://localhost:3000" in address bar');
  console.log('   • Press Enter (don\'t click suggestions)');
  console.log('   • Clear all localhost data in Safari preferences');
  console.log('   • Restart Safari and try again');
  console.log('');
  
  console.log('✅ The diagnostic tool will test and fix any remaining issues!');
}

async function main() {
  try {
    console.log('🚀 Setting up Safari-compatible production environment...\n');
    
    // Create scripts and update configuration
    createHTTPStartScript();
    updatePackageJson();
    
    // Clear Next.js cache
    runCommand('rm -rf .next/cache', 'Clearing Next.js cache');
    
    // Build the application
    console.log('🏗️  Building application for production...');
    runCommand('npm run build', 'Building Next.js application');
    
    clearSafariCache();
    displaySafariInstructions();
    
    console.log('\n🎉 Safari production setup complete!');
    console.log('Now run: npm run safari:start');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

main();
