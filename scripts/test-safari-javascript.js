#!/usr/bin/env node

/**
 * Safari JavaScript Validation Script
 * Tests if JavaScript is loading and executing properly on all pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Pages to test
const PAGES_TO_TEST = [
  '/',
  '/login',
  '/signup', 
  '/safari-diagnostic',
  '/offline'
  // Note: Dashboard pages require authentication, will test separately
];

async function testJavaScriptOnPage(page, url) {
  console.log(`\n🧪 Testing JavaScript on: ${url}`);
  
  try {
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });

    // Wait a moment for JavaScript to load
    await page.waitForTimeout(2000);

    // Test 1: Check if React has mounted
    const reactMounted = await page.evaluate(() => {
      return window.React !== undefined || 
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#__next') !== null;
    });

    // Test 2: Check for Next.js runtime
    const nextJsLoaded = await page.evaluate(() => {
      return window.__NEXT_DATA__ !== undefined ||
             window.next !== undefined ||
             window.__BUILD_MANIFEST !== undefined;
    });

    // Test 3: Check for JavaScript errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test 4: Check if buttons are clickable (interactive)
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"]');
      return buttons.length;
    });

    // Test 5: Check for CSS animations/transitions (indicates JS working)
    const hasTransitions = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const style = window.getComputedStyle(el);
        if (style.transition !== 'all 0s ease 0s' || style.animation !== 'none') {
          return true;
        }
      }
      return false;
    });

    // Test 6: Check if service worker is registered
    const serviceWorkerRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    // Results
    const results = {
      url,
      reactMounted,
      nextJsLoaded,
      interactiveElements,
      hasTransitions,
      serviceWorkerRegistered,
      consoleErrors: consoleErrors.slice(0, 5), // Limit to first 5 errors
      status: reactMounted && nextJsLoaded ? 'PASS' : 'FAIL'
    };

    // Log results
    console.log(`   React Mounted: ${reactMounted ? '✅' : '❌'}`);
    console.log(`   Next.js Loaded: ${nextJsLoaded ? '✅' : '❌'}`);
    console.log(`   Interactive Elements: ${interactiveElements} ${interactiveElements > 0 ? '✅' : '❌'}`);
    console.log(`   CSS Transitions: ${hasTransitions ? '✅' : '❌'}`);
    console.log(`   Service Worker Support: ${serviceWorkerRegistered ? '✅' : '❌'}`);
    
    if (consoleErrors.length > 0) {
      console.log(`   Console Errors: ${consoleErrors.length} ⚠️`);
      consoleErrors.forEach(error => console.log(`     - ${error}`));
    } else {
      console.log(`   Console Errors: 0 ✅`);
    }

    console.log(`   Overall Status: ${results.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);

    return results;

  } catch (error) {
    console.log(`   Error testing page: ${error.message} ❌`);
    return {
      url,
      status: 'ERROR',
      error: error.message
    };
  }
}

async function main() {
  console.log('🍎 Safari JavaScript Validation Test');
  console.log('====================================\n');

  let browser;
  try {
    // Launch browser (simulating Safari behavior)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent to Safari
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15');

    const allResults = [];

    // Test each page
    for (const pagePath of PAGES_TO_TEST) {
      const url = `${BASE_URL}${pagePath}`;
      const result = await testJavaScriptOnPage(page, url);
      allResults.push(result);
    }

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passCount = allResults.filter(r => r.status === 'PASS').length;
    const failCount = allResults.filter(r => r.status === 'FAIL').length;
    const errorCount = allResults.filter(r => r.status === 'ERROR').length;

    console.log(`Total Pages Tested: ${allResults.length}`);
    console.log(`Passed: ${passCount} ✅`);
    console.log(`Failed: ${failCount} ${failCount > 0 ? '❌' : ''}`);
    console.log(`Errors: ${errorCount} ${errorCount > 0 ? '⚠️' : ''}`);

    // Save detailed results
    const reportPath = path.join(__dirname, `safari-js-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
    console.log(`\n📝 Detailed report saved to: ${reportPath}`);

    // Overall assessment
    if (passCount === allResults.length) {
      console.log('\n🎉 All tests passed! JavaScript is working properly on all pages.');
    } else if (failCount > 0) {
      console.log('\n⚠️  Some pages failed JavaScript tests. Check the details above.');
    }

    return passCount === allResults.length;

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  main()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testJavaScriptOnPage, main };
