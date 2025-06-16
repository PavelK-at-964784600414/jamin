#!/usr/bin/env node

/**
 * Simple test script to verify ffmpeg binary availability
 * Tests both the @ffmpeg-installer packages and system ffmpeg
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testFfmpegBinaries() {
  console.log('🧪 Testing ffmpeg binary availability...');
  console.log(`Platform: ${process.platform}, Architecture: ${process.arch}`);
  console.log(`Working Directory: ${process.cwd()}`);
  console.log('');

  // Test 1: Check for @ffmpeg-installer/ffmpeg
  console.log('📍 Test 1: @ffmpeg-installer/ffmpeg');
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    console.log(`✅ @ffmpeg-installer/ffmpeg found: ${ffmpegInstaller.path}`);
    
    try {
      await fs.access(ffmpegInstaller.path, fs.constants.X_OK);
      console.log(`✅ Binary is executable`);
    } catch (accessError) {
      console.log(`⚠️  Binary not executable: ${accessError.message}`);
    }
  } catch (error) {
    console.log(`❌ @ffmpeg-installer/ffmpeg not found: ${error.message}`);
  }

  console.log('');

  // Test 2: Check for @ffmpeg-installer/linux-x64
  console.log('📍 Test 2: @ffmpeg-installer/linux-x64');
  try {
    const linuxFfmpeg = require('@ffmpeg-installer/linux-x64');
    console.log(`✅ @ffmpeg-installer/linux-x64 found: ${linuxFfmpeg.path}`);
    
    try {
      await fs.access(linuxFfmpeg.path, fs.constants.X_OK);
      console.log(`✅ Binary is executable`);
    } catch (accessError) {
      console.log(`⚠️  Binary not executable (expected on non-Linux): ${accessError.message}`);
    }
  } catch (error) {
    console.log(`❌ @ffmpeg-installer/linux-x64 not found: ${error.message}`);
  }

  console.log('');

  // Test 3: Check system ffmpeg
  console.log('📍 Test 3: System ffmpeg');
  try {
    const { stdout } = await execAsync('which ffmpeg || where ffmpeg');
    const systemPath = stdout.trim();
    console.log(`✅ System ffmpeg found: ${systemPath}`);
    
    // Test version
    const { stdout: versionOutput } = await execAsync('ffmpeg -version');
    const versionLine = versionOutput.split('\n')[0];
    console.log(`📦 Version: ${versionLine}`);
  } catch (error) {
    console.log(`❌ System ffmpeg not found: ${error.message}`);
  }

  console.log('');

  // Test 4: Check alternative paths
  console.log('📍 Test 4: Alternative paths');
  const alternativePaths = [
    // Platform-specific paths
    ...(process.platform === 'darwin' && process.arch === 'arm64' ? [
      path.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
      path.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+darwin-arm64@4.1.0/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
    ] : []),
    ...(process.platform === 'darwin' && process.arch === 'x64' ? [
      path.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'),
    ] : []),
    ...(process.platform === 'linux' ? [
      path.join(process.cwd(), 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
      path.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+linux-x64@4.1.0/node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    ] : []),
    
    // System paths
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    '/usr/bin/ffmpeg',
  ];

  for (const altPath of alternativePaths) {
    try {
      await fs.access(altPath, fs.constants.X_OK);
      console.log(`✅ Found executable: ${altPath}`);
    } catch (error) {
      console.log(`❌ Not found: ${altPath}`);
    }
  }

  console.log('');

  // Test 5: Node modules structure
  console.log('📍 Test 5: Node modules structure');
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules/@ffmpeg-installer');
    const installerDirs = await fs.readdir(nodeModulesPath);
    console.log(`✅ Found @ffmpeg-installer variants: ${installerDirs.join(', ')}`);
    
    for (const dir of installerDirs) {
      const ffmpegPath = path.join(nodeModulesPath, dir, 'ffmpeg');
      try {
        const stats = await fs.stat(ffmpegPath);
        console.log(`  📦 ${dir}: ${ffmpegPath} (${stats.size} bytes)`);
      } catch (error) {
        console.log(`  ❌ ${dir}: ffmpeg binary not found`);
      }
    }
  } catch (error) {
    console.log(`❌ @ffmpeg-installer directory not found: ${error.message}`);
  }

  console.log('');
  console.log('🏁 ffmpeg binary test completed!');
}

// Run the test
if (require.main === module) {
  testFfmpegBinaries().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testFfmpegBinaries };
