import { logger } from './lib/logger';

#!/usr/bin/env node

const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runLighthouseAudit() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/dashboard/tools'
  ];

  const results = [];
  
  for (const url of urls) {
    logger.debug(`🔍 Auditing ${url}...`);
    
    try {
      const { lhr } = await lighthouse(url, {
        port: new URL(browser.wsEndpoint()).port,
        output: 'json',
        logLevel: 'info',
        disableDeviceEmulation: true,
        chromeFlags: ['--disable-mobile-emulation']
      });

      const scores = {
        url: url,
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        pwa: Math.round(lhr.categories.pwa.score * 100)
      };

      // Extract key metrics
      const metrics = {
        firstContentfulPaint: lhr.audits['first-contentful-paint'].displayValue,
        largestContentfulPaint: lhr.audits['largest-contentful-paint'].displayValue,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift'].displayValue,
        speedIndex: lhr.audits['speed-index'].displayValue,
        totalBlockingTime: lhr.audits['total-blocking-time'].displayValue
      };

      results.push({ ...scores, metrics });
      
      // Display results
      logger.debug(`✅ ${url}`);
      logger.debug(`   Performance: ${scores.performance}/100`);
      logger.debug(`   Accessibility: ${scores.accessibility}/100`);
      logger.debug(`   Best Practices: ${scores.bestPractices}/100`);
      logger.debug(`   SEO: ${scores.seo}/100`);
      logger.debug(`   PWA: ${scores.pwa}/100`);
      logger.debug(`   FCP: ${metrics.firstContentfulPaint}`);
      logger.debug(`   LCP: ${metrics.largestContentfulPaint}`);
      logger.debug(`   CLS: ${metrics.cumulativeLayoutShift}`);
      logger.debug('');

    } catch (error) {
      logger.error(`❌ Error auditing ${url}:`, error.message);
      results.push({
        url: url,
        error: error.message,
        performance: 0,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        pwa: 0
      });
    }
  }

  await browser.close();

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultPath = path.join(__dirname, `lighthouse-results-${timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  
  logger.debug(`📊 Results saved to: ${resultPath}`);

  // Generate summary
  const summary = generateSummary(results);
  logger.debug('\n📈 Performance Summary:');
  logger.debug(summary);

  return results;
}

function generateSummary(results) {
  const validResults = results.filter(r => !r.error);
  
  if (validResults.length === 0) {
    return '❌ No valid results to summarize';
  }

  const averages = {
    performance: Math.round(validResults.reduce((sum, r) => sum + r.performance, 0) / validResults.length),
    accessibility: Math.round(validResults.reduce((sum, r) => sum + r.accessibility, 0) / validResults.length),
    bestPractices: Math.round(validResults.reduce((sum, r) => sum + r.bestPractices, 0) / validResults.length),
    seo: Math.round(validResults.reduce((sum, r) => sum + r.seo, 0) / validResults.length),
    pwa: Math.round(validResults.reduce((sum, r) => sum + r.pwa, 0) / validResults.length)
  };

  return `
  📊 Average Scores:
     Performance: ${averages.performance}/100 ${getScoreEmoji(averages.performance)}
     Accessibility: ${averages.accessibility}/100 ${getScoreEmoji(averages.accessibility)}
     Best Practices: ${averages.bestPractices}/100 ${getScoreEmoji(averages.bestPractices)}
     SEO: ${averages.seo}/100 ${getScoreEmoji(averages.seo)}
     PWA: ${averages.pwa}/100 ${getScoreEmoji(averages.pwa)}
  
  📋 Recommendations:
     ${averages.performance < 80 ? '• Focus on performance optimization (code splitting, image optimization)' : '✅ Performance looks good'}
     ${averages.accessibility < 90 ? '• Improve accessibility (alt texts, ARIA labels, contrast)' : '✅ Accessibility is excellent'}
     ${averages.bestPractices < 90 ? '• Review best practices (HTTPS, no console errors, modern APIs)' : '✅ Following best practices'}
     ${averages.seo < 90 ? '• Enhance SEO (meta tags, structured data, sitemap)' : '✅ SEO is well optimized'}
     ${averages.pwa < 70 ? '• Implement PWA features (service worker, manifest, offline support)' : '✅ PWA features are good'}
  `;
}

function getScoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  return '🔴';
}

// Run the audit if called directly
if (require.main === module) {
  logger.debug('🚀 Starting Lighthouse Performance Audit...\n');
  
  runLighthouseAudit()
    .then(() => {
      logger.debug('\n✨ Audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n💥 Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { runLighthouseAudit };
