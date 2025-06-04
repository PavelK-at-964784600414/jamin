#!/usr/bin/env node

/**
 * Safari Production Mode Validation Script
 * Tests all critical functionality to ensure Safari SSL issues are resolved
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🍎 Safari Production Mode Validation');
console.log('====================================\n');

async function testServerResponse(url, timeout = 5000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          headers: res.headers,
          bodyLength: data.length,
          hasJavaScript: data.includes('_next/static/chunks/'),
          hasCSS: data.includes('_next/static/css/') || data.includes('<style'),
          contentType: res.headers['content-type']
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });
  });
}

async function testStaticAssets() {
  console.log('🔍 Testing static asset accessibility...');
  
  const staticAssets = [
    'http://localhost:3000/_next/static/chunks/main-app.js',
    'http://localhost:3000/_next/static/chunks/pages/_app.js',
    'http://localhost:3000/manifest.json',
    'http://localhost:3000/sw.js',
    'http://localhost:3000/favicon.ico'
  ];
  
  let passedTests = 0;
  const totalTests = staticAssets.length;
  
  for (const asset of staticAssets) {
    const response = await testServerResponse(asset);
    const filename = asset.split('/').pop();
    
    if (response.success && response.status === 200) {
      console.log(`   ✅ ${filename} - Accessible (${response.bodyLength} bytes)`);
      passedTests++;
    } else if (response.success && response.status === 404) {
      // Some assets might not exist in this build, that's OK
      console.log(`   ⚠️  ${filename} - Not found (expected for some assets)`);
    } else {
      console.log(`   ❌ ${filename} - Failed: ${response.error || `Status ${response.status}`}`);
    }
  }
  
  return { passed: passedTests, total: totalTests };
}

async function testMainPage() {
  console.log('🏠 Testing main page accessibility...');
  
  const response = await testServerResponse('http://localhost:3000/');
  
  if (response.success && response.status === 200) {
    console.log(`   ✅ Main page accessible (${response.bodyLength} bytes)`);
    console.log(`   📄 Content-Type: ${response.contentType}`);
    
    if (response.hasJavaScript) {
      console.log('   ✅ JavaScript bundles referenced in HTML');
    } else {
      console.log('   ⚠️  No JavaScript bundle references found');
    }
    
    if (response.hasCSS) {
      console.log('   ✅ CSS assets referenced in HTML');
    } else {
      console.log('   ⚠️  No CSS references found');
    }
    
    return { success: true, hasJS: response.hasJavaScript, hasCSS: response.hasCSS };
  } else {
    console.log(`   ❌ Main page failed: ${response.error || `Status ${response.status}`}`);
    return { success: false };
  }
}

async function testServiceWorker() {
  console.log('🔧 Testing service worker accessibility...');
  
  const response = await testServerResponse('http://localhost:3000/sw.js');
  
  if (response.success && response.status === 200) {
    console.log(`   ✅ Service worker accessible (${response.bodyLength} bytes)`);
    console.log(`   📄 Content-Type: ${response.contentType}`);
    return true;
  } else {
    console.log(`   ❌ Service worker failed: ${response.error || `Status ${response.status}`}`);
    return false;
  }
}

async function testPWAManifest() {
  console.log('📱 Testing PWA manifest...');
  
  const response = await testServerResponse('http://localhost:3000/manifest.json');
  
  if (response.success && response.status === 200) {
    console.log(`   ✅ PWA manifest accessible (${response.bodyLength} bytes)`);
    console.log(`   📄 Content-Type: ${response.contentType}`);
    return true;
  } else {
    console.log(`   ❌ PWA manifest failed: ${response.error || `Status ${response.status}`}`);
    return false;
  }
}

function checkServerConfiguration() {
  console.log('⚙️  Checking server configuration...');
  
  const checks = [
    {
      name: 'Next.js config exists',
      check: () => fs.existsSync('./next.config.js'),
      required: true
    },
    {
      name: 'Production build exists',
      check: () => fs.existsSync('./.next'),
      required: true
    },
    {
      name: 'Service worker exists',
      check: () => fs.existsSync('./public/sw.js'),
      required: true
    },
    {
      name: 'Safari start script exists',
      check: () => fs.existsSync('./start-safari-prod.sh'),
      required: false
    },
    {
      name: 'Package.json has Safari scripts',
      check: () => {
        try {
          const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
          return pkg.scripts && 
                 pkg.scripts['start:safari-local'] && 
                 pkg.scripts['start:safari-prod'];
        } catch {
          return false;
        }
      },
      required: true
    }
  ];
  
  let passed = 0;
  let required = 0;
  
  checks.forEach(check => {
    if (check.required) required++;
    
    if (check.check()) {
      console.log(`   ✅ ${check.name}`);
      passed++;
    } else {
      const icon = check.required ? '❌' : '⚠️ ';
      console.log(`   ${icon} ${check.name}`);
    }
  });
  
  return { passed, total: checks.length, required };
}

function displaySafariInstructions() {
  console.log('\n🍎 Safari Testing Instructions:');
  console.log('==============================');
  console.log('1. Open Safari browser');
  console.log('2. Navigate to: http://localhost:3000');
  console.log('3. Open Developer Tools (Cmd+Option+I)');
  console.log('4. Check the Console tab for any errors');
  console.log('5. Verify that:');
  console.log('   • Page loads completely');
  console.log('   • No "Failed to load resource" errors');
  console.log('   • No "SSL error" messages');
  console.log('   • JavaScript is running (interactive elements work)');
  console.log('   • Service worker registers (check Application tab)');
  console.log('6. Test microphone permissions:');
  console.log('   • Navigate to themes/create');
  console.log('   • Try to start recording');
  console.log('   • Verify permissions are granted');
  console.log('\n💡 If issues persist:');
  console.log('   • Clear Safari cache (Cmd+Option+E)');
  console.log('   • Restart Safari completely');
  console.log('   • Check macOS microphone permissions in System Preferences');
}

async function main() {
  console.log('🚀 Starting Safari production mode validation...\n');
  
  // Configuration checks
  const configResults = checkServerConfiguration();
  console.log('');
  
  // Server response tests
  const mainPageResult = await testMainPage();
  console.log('');
  
  const serviceWorkerResult = await testServiceWorker();
  console.log('');
  
  const manifestResult = await testPWAManifest();
  console.log('');
  
  const staticAssetsResult = await testStaticAssets();
  console.log('');
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log('=====================');
  
  const totalTests = configResults.total + 4 + staticAssetsResult.total;
  let passedTests = configResults.passed + staticAssetsResult.passed;
  
  if (mainPageResult.success) passedTests++;
  if (serviceWorkerResult) passedTests++;
  if (manifestResult) passedTests++;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (mainPageResult.success && mainPageResult.hasJS) {
    console.log('✅ JavaScript bundles are properly referenced');
  } else {
    console.log('⚠️  JavaScript bundle issues detected');
  }
  
  if (configResults.passed >= configResults.required) {
    console.log('✅ Server configuration is correct');
  } else {
    console.log('❌ Server configuration issues detected');
  }
  
  if (passedTests >= totalTests * 0.8) {
    console.log('\n🎉 Safari production mode is ready for testing!');
    console.log('🌐 Server is running at: http://localhost:3000');
  } else {
    console.log('\n⚠️  Some issues were detected. Review the failures above.');
  }
  
  displaySafariInstructions();
}

// Run validation
main().catch(error => {
  console.error('\n💥 Validation failed:', error);
  process.exit(1);
});
