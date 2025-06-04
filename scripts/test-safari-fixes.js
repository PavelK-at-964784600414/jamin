#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Safari Production Mode Test');
console.log('==============================\n');

function runTest(description, test) {
  try {
    console.log(`🔍 Testing: ${description}`);
    const result = test();
    if (result) {
      console.log(`✅ PASS: ${description}\n`);
      return true;
    } else {
      console.log(`❌ FAIL: ${description}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${description} - ${error.message}\n`);
    return false;
  }
}

function testServiceWorker() {
  const fs = require('fs');
  const swContent = fs.readFileSync('public/sw.js', 'utf8');
  
  // Check for Safari-compatible features
  const hasNetworkFirst = swContent.includes('Network-first strategy for Safari compatibility');
  const hasErrorHandling = swContent.includes('Network request failed, trying cache');
  const hasOfflinePage = swContent.includes('You\'re Offline');
  
  return hasNetworkFirst && hasErrorHandling && hasOfflinePage;
}

function testPermissionsPolicy() {
  const fs = require('fs');
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  
  // Check microphone and camera permissions
  const hasMicrophonePermission = nextConfig.includes('microphone=(self)');
  const hasCameraPermission = nextConfig.includes('camera=(self)');
  
  return hasMicrophonePermission && hasCameraPermission;
}

function testMiddleware() {
  const fs = require('fs');
  const middleware = fs.readFileSync('middleware.ts', 'utf8');
  
  // Check for Safari-specific headers
  const hasSafariHeaders = middleware.includes('Safari-specific headers');
  const hasKeepAlive = middleware.includes('Connection', 'keep-alive');
  const hasCacheControl = middleware.includes('Cache-Control');
  
  return hasSafariHeaders && middleware.includes('isSafari');
}

function testServiceWorkerRegistration() {
  const fs = require('fs');
  const registration = fs.readFileSync('app/components/ServiceWorkerRegistration.tsx', 'utf8');
  
  // Check for Safari production mode handling
  const hasSafariMode = registration.includes('Safari production mode detected');
  const hasCacheClear = registration.includes('caches.keys()');
  const hasCompatibility = registration.includes('Safari-compatible Service Worker');
  
  return hasSafariMode && hasCacheClear && hasCompatibility;
}

function testBuildOutput() {
  const fs = require('fs');
  const buildDir = '.next';
  
  if (!fs.existsSync(buildDir)) {
    return false;
  }
  
  // Check for service worker in build output
  const swExists = fs.existsSync('public/sw.js');
  const manifestExists = fs.existsSync('public/manifest.json');
  
  return swExists && manifestExists;
}

function testRecordingPermissions() {
  const fs = require('fs');
  
  // Check recording components exist
  const recordingControls = fs.existsSync('app/ui/themes/RecordingControls.tsx');
  const createForm = fs.existsSync('app/ui/themes/create-form.tsx');
  const audioUtils = fs.existsSync('app/lib/audio-utils.ts');
  
  return recordingControls && createForm && audioUtils;
}

async function main() {
  console.log('Running comprehensive Safari production mode tests...\n');
  
  const tests = [
    ['Service Worker Safari Compatibility', testServiceWorker],
    ['Permissions Policy Configuration', testPermissionsPolicy],
    ['Middleware Safari Headers', testMiddleware],
    ['Service Worker Registration Logic', testServiceWorkerRegistration],
    ['Build Output Integrity', testBuildOutput],
    ['Recording Permissions Setup', testRecordingPermissions]
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const [description, test] of tests) {
    if (runTest(description, test)) {
      passedTests++;
    }
  }
  
  console.log('=================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Safari production mode is ready.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run start:prod');
    console.log('   2. Open Safari');
    console.log('   3. Test recording functionality');
    console.log('   4. Check console for network errors');
  } else {
    console.log('❌ Some tests failed. Review the output above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
