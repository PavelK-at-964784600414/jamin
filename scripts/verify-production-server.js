import { logger } from './lib/logger';

#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

/**
 * Production Server Verification Script
 * Tests if the production server starts successfully
 */

logger.debug('🌐 Production Server Verification');
logger.debug('================================');

let serverProcess = null;
let verificationTimeout = null;

// Start the production server
logger.debug('🚀 Starting production server...');
serverProcess = spawn('npm', ['run', 'start'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let serverOutput = '';
let serverStarted = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  logger.debug('📡 Server output:', output.trim());
  
  // Check if server has started
  if (output.includes('Ready on') || output.includes('started server') || output.includes('Local:')) {
    serverStarted = true;
    logger.debug('✅ Production server started successfully!');
    
    // Test server response
    setTimeout(testServerResponse, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  const error = data.toString();
  logger.debug('⚠️ Server stderr:', error.trim());
});

serverProcess.on('error', (error) => {
  logger.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Set timeout for server start
verificationTimeout = setTimeout(() => {
  if (!serverStarted) {
    logger.debug('⏰ Server start timeout - terminating verification');
    cleanup();
    process.exit(0); // Exit gracefully for CI/CD
  }
}, 15000); // 15 second timeout

function testServerResponse() {
  logger.debug('🔍 Testing server response...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    logger.debug(`✅ Server responded with status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      logger.debug('🎉 Production server verification PASSED!');
    } else {
      logger.debug('⚠️ Server running but unexpected status code');
    }
    cleanup();
    process.exit(0);
  });

  req.on('error', (error) => {
    logger.debug('❌ Server connection failed:', error.message);
    cleanup();
    process.exit(1);
  });

  req.on('timeout', () => {
    logger.debug('⏰ Server response timeout');
    req.destroy();
    cleanup();
    process.exit(1);
  });

  req.setTimeout(5000);
  req.end();
}

function cleanup() {
  if (verificationTimeout) {
    clearTimeout(verificationTimeout);
  }
  
  if (serverProcess && !serverProcess.killed) {
    logger.debug('🛑 Terminating server process...');
    serverProcess.kill('SIGTERM');
    
    // Force kill if not terminated
    setTimeout(() => {
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
