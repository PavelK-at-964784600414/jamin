#!/usr/bin/env node

/**
 * Test script to verify ffmpeg binary resolution in different environments
 * This script tests the aws-lambda-ffmpeg.ts module to ensure it can find
 * ffmpeg binaries in local development, Next.js build, and AWS Lambda environments.
 */

const { setupAwsLambdaFfmpeg, getAwsLambdaFfmpegPath, getAwsLambdaFfmpegArgs } = require('../app/lib/aws-lambda-ffmpeg.ts');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testFfmpegResolution() {
  console.log('🧪 Testing ffmpeg binary resolution...');
  console.log(`Platform: ${process.platform}, Architecture: ${process.arch}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  // Test 1: Basic path resolution
  console.log('📍 Test 1: Basic ffmpeg path resolution');
  try {
    const ffmpegPath = getAwsLambdaFfmpegPath();
    console.log(`✅ ffmpeg path resolved: ${ffmpegPath}`);
    
    // Verify the path exists and is executable
    try {
      if (ffmpegPath === 'ffmpeg') {
        // Test system PATH
        await execAsync('which ffmpeg || where ffmpeg');
        console.log(`✅ System ffmpeg found in PATH`);
      } else {
        await fs.access(ffmpegPath, fs.constants.X_OK);
        console.log(`✅ ffmpeg binary exists and is executable`);
      }
    } catch (accessError) {
      console.log(`⚠️  ffmpeg binary not accessible: ${accessError.message}`);
    }
  } catch (error) {
    console.log(`❌ Failed to resolve ffmpeg path: ${error.message}`);
  }

  console.log('');

  // Test 2: AWS Lambda-compatible setup
  console.log('📍 Test 2: AWS Lambda-compatible setup');
  try {
    const ffmpegPath = await setupAwsLambdaFfmpeg();
    console.log(`✅ AWS Lambda ffmpeg setup completed: ${ffmpegPath}`);
    
    // Verify the path works
    try {
      if (ffmpegPath === 'ffmpeg') {
        await execAsync('which ffmpeg || where ffmpeg');
        console.log(`✅ System ffmpeg accessible`);
      } else {
        await fs.access(ffmpegPath, fs.constants.X_OK);
        console.log(`✅ ffmpeg binary verified and executable`);
      }
    } catch (accessError) {
      console.log(`⚠️  ffmpeg setup path not accessible: ${accessError.message}`);
    }
  } catch (error) {
    console.log(`❌ AWS Lambda ffmpeg setup failed: ${error.message}`);
  }

  console.log('');

  // Test 3: ffmpeg arguments
  console.log('📍 Test 3: AWS Lambda ffmpeg arguments');
  try {
    const args = getAwsLambdaFfmpegArgs();
    console.log(`✅ AWS Lambda ffmpeg arguments: ${args.join(' ')}`);
  } catch (error) {
    console.log(`❌ Failed to get ffmpeg arguments: ${error.message}`);
  }

  console.log('');

  // Test 4: Basic ffmpeg functionality test
  console.log('📍 Test 4: Basic ffmpeg functionality test');
  try {
    const ffmpegPath = await setupAwsLambdaFfmpeg();
    const testCommand = `${ffmpegPath === 'ffmpeg' ? 'ffmpeg' : `"${ffmpegPath}"`} -version`;
    
    const { stdout, stderr } = await execAsync(testCommand);
    console.log(`✅ ffmpeg version check successful`);
    
    // Extract version info from stdout
    const versionLine = stdout.split('\n')[0];
    console.log(`📦 Version: ${versionLine}`);
  } catch (error) {
    console.log(`❌ ffmpeg functionality test failed: ${error.message}`);
  }

  console.log('');

  // Test 5: Environment simulation
  console.log('📍 Test 5: Environment simulation tests');
  
  // Simulate AWS Lambda environment
  console.log('  🔄 Simulating AWS Lambda environment...');
  const originalLambdaEnv = process.env.AWS_LAMBDA_FUNCTION_NAME;
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
  
  try {
    const lambdaPath = getAwsLambdaFfmpegPath();
    console.log(`  ✅ Lambda simulation path: ${lambdaPath}`);
  } catch (error) {
    console.log(`  ❌ Lambda simulation failed: ${error.message}`);
  } finally {
    // Restore original environment
    if (originalLambdaEnv) {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalLambdaEnv;
    } else {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    }
  }

  // Simulate Vercel environment
  console.log('  🔄 Simulating Vercel environment...');
  const originalVercelEnv = process.env.VERCEL;
  process.env.VERCEL = '1';
  
  try {
    const vercelPath = getAwsLambdaFfmpegPath();
    console.log(`  ✅ Vercel simulation path: ${vercelPath}`);
  } catch (error) {
    console.log(`  ❌ Vercel simulation failed: ${error.message}`);
  } finally {
    // Restore original environment
    if (originalVercelEnv) {
      process.env.VERCEL = originalVercelEnv;
    } else {
      delete process.env.VERCEL;
    }
  }

  console.log('');
  console.log('🏁 ffmpeg resolution test completed!');
}

// Run the test
if (require.main === module) {
  testFfmpegResolution().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testFfmpegResolution };
