#!/usr/bin/env node
// Test script to verify AWS Lambda ffmpeg setup

console.log('🔍 Testing AWS Lambda ffmpeg setup...\n');

// Test 1: Check if packages are installed
console.log('1. Checking installed ffmpeg packages:');
try {
  const ffmpegMain = require('@ffmpeg-installer/ffmpeg');
  console.log(`   ✅ @ffmpeg-installer/ffmpeg: ${ffmpegMain.path}`);
} catch (e) {
  console.log(`   ❌ @ffmpeg-installer/ffmpeg: Not found`);
}

try {
  const ffmpegLinux = require('@ffmpeg-installer/linux-x64');
  console.log(`   ✅ @ffmpeg-installer/linux-x64: ${ffmpegLinux.path}`);
} catch (e) {
  console.log(`   ❌ @ffmpeg-installer/linux-x64: Not found`);
}

console.log();

// Test 2: Check AWS Lambda ffmpeg utilities
console.log('2. Testing AWS Lambda ffmpeg utilities:');
try {
  const { getAwsLambdaFfmpegPath, isAwsLambdaEnvironment } = require('../app/lib/aws-lambda-ffmpeg');
  
  console.log(`   Lambda environment detected: ${isAwsLambdaEnvironment()}`);
  console.log(`   Detected ffmpeg path: ${getAwsLambdaFfmpegPath()}`);
  
  // Test setup function
  console.log('\n3. Testing ffmpeg setup:');
  const { setupAwsLambdaFfmpeg } = require('../app/lib/aws-lambda-ffmpeg');
  setupAwsLambdaFfmpeg().then(path => {
    console.log(`   ✅ Setup successful: ${path}`);
    
    // Test if file exists
    const fs = require('fs');
    try {
      fs.accessSync(path, fs.constants.F_OK);
      console.log(`   ✅ File exists and is accessible`);
    } catch (e) {
      console.log(`   ❌ File not accessible: ${e.message}`);
    }
  }).catch(error => {
    console.log(`   ❌ Setup failed: ${error.message}`);
  });
  
} catch (e) {
  console.log(`   ❌ Failed to load AWS Lambda ffmpeg utilities: ${e.message}`);
}

console.log('\n4. Environment information:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}`);
console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
console.log(`   AWS_LAMBDA_FUNCTION_NAME: ${process.env.AWS_LAMBDA_FUNCTION_NAME || 'not set'}`);
