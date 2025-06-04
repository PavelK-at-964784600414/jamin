import { logger } from './lib/logger';

#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import our custom analysis tools
const { runLighthouseAudit } = require('./lighthouse-audit.js');
const { analyzeBundles } = require('./bundle-analyzer.js');

async function deploymentChecklist() {
  logger.debug('🚀 Production Deployment Checklist');
  logger.debug('==================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Step 1: Environment validation
  await runStep(results, 'Environment Validation', async () => {
    logger.debug('   📋 Checking environment variables...');
    try {
      execSync('npm run env:validate', { stdio: 'inherit' });
      return { status: 'pass', message: 'Environment variables validated' };
    } catch (error) {
      return { status: 'fail', message: 'Environment validation failed', error: error.message };
    }
  });

  // Step 2: Security audit
  await runStep(results, 'Security Audit', async () => {
    logger.debug('   🔒 Running security audit...');
    try {
      const auditOutput = execSync('npm audit --audit-level moderate', { encoding: 'utf8' });
      const vulnerabilities = auditOutput.includes('vulnerabilities');
      if (vulnerabilities) {
        return { status: 'warning', message: 'Security vulnerabilities found - review npm audit output' };
      }
      return { status: 'pass', message: 'No security vulnerabilities found' };
    } catch (error) {
      return { status: 'warning', message: 'Security audit completed with findings', error: error.message };
    }
  });

  // Step 3: Type checking
  await runStep(results, 'TypeScript Type Check', async () => {
    logger.debug('   📝 Running TypeScript type check...');
    try {
      execSync('npm run type-check', { stdio: 'inherit' });
      return { status: 'pass', message: 'TypeScript compilation successful' };
    } catch (error) {
      return { status: 'fail', message: 'TypeScript type errors found', error: error.message };
    }
  });

  // Step 4: Linting
  await runStep(results, 'Code Linting', async () => {
    logger.debug('   🧹 Running linter...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      return { status: 'pass', message: 'Code linting passed' };
    } catch (error) {
      return { status: 'warning', message: 'Linting issues found - consider fixing', error: error.message };
    }
  });

  // Step 5: Production build
  await runStep(results, 'Production Build', async () => {
    logger.debug('   🔨 Building for production...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      
      // Check if build was successful
      if (fs.existsSync('.next')) {
        return { status: 'pass', message: 'Production build successful' };
      } else {
        return { status: 'fail', message: 'Build directory not created' };
      }
    } catch (error) {
      return { status: 'fail', message: 'Production build failed', error: error.message };
    }
  });

  // Step 6: Bundle analysis
  await runStep(results, 'Bundle Analysis', async () => {
    logger.debug('   📦 Analyzing bundle size...');
    try {
      const analysis = await analyzeBundles();
      const sizeMB = analysis.summary.totalSizeMB;
      
      if (sizeMB > 10) {
        return { status: 'fail', message: `Bundle too large: ${sizeMB}MB (>10MB)`, data: analysis.summary };
      } else if (sizeMB > 5) {
        return { status: 'warning', message: `Bundle size: ${sizeMB}MB (consider optimization)`, data: analysis.summary };
      } else {
        return { status: 'pass', message: `Bundle size optimal: ${sizeMB}MB`, data: analysis.summary };
      }
    } catch (error) {
      return { status: 'warning', message: 'Bundle analysis failed', error: error.message };
    }
  });

  // Step 7: Start production server (background)
  let serverProcess;
  await runStep(results, 'Start Production Server', async () => {
    logger.debug('   🌐 Starting production server...');
    try {
      // Start server in background
      const { spawn } = require('child_process');
      serverProcess = spawn('npm', ['run', 'start:prod'], { 
        detached: false,
        stdio: 'pipe'
      });

      // Wait for server to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server start timeout'));
        }, 30000);

        serverProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Local:') || output.includes('localhost:3000')) {
            clearTimeout(timeout);
            resolve();
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      return { status: 'pass', message: 'Production server started successfully' };
    } catch (error) {
      return { status: 'fail', message: 'Failed to start production server', error: error.message };
    }
  });

  // Step 8: Performance audit (if server is running)
  if (serverProcess) {
    await runStep(results, 'Performance Audit', async () => {
      logger.debug('   🏃 Running Lighthouse performance audit...');
      try {
        // Wait a bit for server to be fully ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const auditResults = await runLighthouseAudit();
        const avgPerformance = auditResults.reduce((sum, r) => sum + (r.performance || 0), 0) / auditResults.length;
        
        if (avgPerformance < 50) {
          return { status: 'fail', message: `Performance score too low: ${avgPerformance}/100`, data: auditResults };
        } else if (avgPerformance < 70) {
          return { status: 'warning', message: `Performance could be improved: ${avgPerformance}/100`, data: auditResults };
        } else {
          return { status: 'pass', message: `Performance score good: ${avgPerformance}/100`, data: auditResults };
        }
      } catch (error) {
        return { status: 'warning', message: 'Performance audit failed', error: error.message };
      }
    });

    // Clean up server
    try {
      serverProcess.kill();
    } catch (error) {
      logger.debug('   ⚠️  Could not kill server process, may need manual cleanup');
    }
  }

  // Step 9: PWA validation
  await runStep(results, 'PWA Validation', async () => {
    logger.debug('   📱 Validating PWA configuration...');
    
    const checks = [];
    
    // Check manifest.json
    if (fs.existsSync('public/manifest.json')) {
      checks.push('✅ Manifest file exists');
      try {
        const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
        if (manifest.name && manifest.short_name && manifest.icons) {
          checks.push('✅ Manifest has required fields');
        } else {
          checks.push('❌ Manifest missing required fields');
        }
      } catch (error) {
        checks.push('❌ Manifest file invalid JSON');
      }
    } else {
      checks.push('❌ Manifest file missing');
    }
    
    // Check service worker
    if (fs.existsSync('public/sw.js')) {
      checks.push('✅ Service worker exists');
    } else {
      checks.push('❌ Service worker missing');
    }
    
    // Check icons
    const iconSizes = ['192x192', '512x512'];
    iconSizes.forEach(size => {
      if (fs.existsSync(`public/icon-${size}.png`)) {
        checks.push(`✅ Icon ${size} exists`);
      } else {
        checks.push(`❌ Icon ${size} missing`);
      }
    });
    
    const passedChecks = checks.filter(c => c.startsWith('✅')).length;
    const totalChecks = checks.length;
    
    return {
      status: passedChecks === totalChecks ? 'pass' : 'warning',
      message: `PWA validation: ${passedChecks}/${totalChecks} checks passed`,
      data: checks
    };
  });

  // Step 10: Security headers check
  await runStep(results, 'Security Headers', async () => {
    logger.debug('   🛡️  Checking security configuration...');
    
    const checks = [];
    
    // Check Next.js config
    if (fs.existsSync('next.config.js')) {
      const config = fs.readFileSync('next.config.js', 'utf8');
      
      if (config.includes('X-Frame-Options')) {
        checks.push('✅ X-Frame-Options configured');
      } else {
        checks.push('❌ X-Frame-Options missing');
      }
      
      if (config.includes('X-Content-Type-Options')) {
        checks.push('✅ X-Content-Type-Options configured');
      } else {
        checks.push('❌ X-Content-Type-Options missing');
      }
      
      if (config.includes('Referrer-Policy')) {
        checks.push('✅ Referrer-Policy configured');
      } else {
        checks.push('❌ Referrer-Policy missing');
      }
    }
    
    const passedChecks = checks.filter(c => c.startsWith('✅')).length;
    const totalChecks = checks.length;
    
    return {
      status: passedChecks >= totalChecks * 0.8 ? 'pass' : 'warning',
      message: `Security headers: ${passedChecks}/${totalChecks} configured`,
      data: checks
    };
  });

  // Generate final report
  generateFinalReport(results);
  
  return results;
}

async function runStep(results, stepName, stepFunction) {
  logger.debug(`\n🔄 ${stepName}`);
  logger.debug('─'.repeat(stepName.length + 3));
  
  try {
    const result = await stepFunction();
    
    const step = {
      name: stepName,
      status: result.status,
      message: result.message,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString()
    };
    
    results.steps.push(step);
    
    switch (result.status) {
      case 'pass':
        logger.debug(`   ✅ ${result.message}`);
        results.passed++;
        break;
      case 'warning':
        logger.debug(`   ⚠️  ${result.message}`);
        results.warnings++;
        break;
      case 'fail':
        logger.debug(`   ❌ ${result.message}`);
        results.failed++;
        break;
    }
    
    if (result.error) {
      logger.debug(`   💬 ${result.error}`);
    }
    
  } catch (error) {
    logger.debug(`   💥 Unexpected error: ${error.message}`);
    results.steps.push({
      name: stepName,
      status: 'fail',
      message: 'Unexpected error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    results.failed++;
  }
}

function generateFinalReport(results) {
  logger.debug('\n🎯 Deployment Readiness Report');
  logger.debug('===============================\n');
  
  const total = results.passed + results.warnings + results.failed;
  const successRate = Math.round((results.passed / total) * 100);
  
  logger.debug(`📊 Overall Status: ${successRate}% Ready`);
  logger.debug(`✅ Passed: ${results.passed}`);
  logger.debug(`⚠️  Warnings: ${results.warnings}`);
  logger.debug(`❌ Failed: ${results.failed}`);
  logger.debug(`📋 Total Steps: ${total}\n`);
  
  // Deployment recommendation
  if (results.failed === 0 && results.warnings <= 2) {
    logger.debug('🚀 READY FOR DEPLOYMENT');
    logger.debug('   Your application is ready for production deployment!');
  } else if (results.failed <= 1 && results.warnings <= 3) {
    logger.debug('⚠️  DEPLOY WITH CAUTION');
    logger.debug('   You can deploy but should address the issues above.');
  } else {
    logger.debug('🛑 NOT READY FOR DEPLOYMENT');
    logger.debug('   Please fix the failing checks before deploying.');
  }
  
  // Save detailed report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `deployment-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  logger.debug(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Run checklist if called directly
if (require.main === module) {
  deploymentChecklist()
    .then((results) => {
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      logger.error('\n💥 Deployment checklist failed:', error);
      process.exit(1);
    });
}

module.exports = { deploymentChecklist };
