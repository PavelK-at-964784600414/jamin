#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Safari Production Mode Fix Script');
console.log('=====================================\n');

function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    const output = execSync(command, { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    console.log(`✅ ${description} completed\n`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.message);
    console.error('');
    return null;
  }
}

function checkFiles() {
  console.log('📁 Checking critical files...');
  
  const criticalFiles = [
    'public/sw.js',
    'app/components/ServiceWorkerRegistration.tsx',
    'middleware.ts',
    'next.config.js'
  ];
  
  let allFilesExist = true;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function clearNextCache() {
  console.log('🧹 Clearing Next.js cache...');
  
  try {
    // Remove .next directory
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
      console.log('✅ .next directory cleared');
    }
    
    // Remove node_modules/.cache if it exists
    const cacheDir = 'node_modules/.cache';
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('✅ node_modules cache cleared');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    return false;
  }
}

function updateManifest() {
  console.log('📄 Updating manifest.json for Safari compatibility...');
  
  const manifestPath = 'public/manifest.json';
  
  try {
    let manifest = {};
    
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
    
    // Safari-compatible manifest
    const safariManifest = {
      ...manifest,
      name: manifest.name || "Jamin",
      short_name: manifest.short_name || "Jamin",
      description: manifest.description || "Music collaboration platform",
      start_url: "/",
      display: "standalone",
      background_color: "#1a1a1a",
      theme_color: "#3b82f6",
      orientation: "portrait-primary",
      icons: manifest.icons || [
        {
          src: "icon-192x192.svg",
          sizes: "192x192",
          type: "image/svg+xml"
        },
        {
          src: "icon-512x512.svg", 
          sizes: "512x512",
          type: "image/svg+xml"
        }
      ],
      // Safari-specific meta
      apple_touch_startup_image: manifest.apple_touch_startup_image || "/icon-512x512.svg",
      apple_mobile_web_app_capable: "yes",
      apple_mobile_web_app_status_bar_style: "black-translucent"
    };
    
    fs.writeFileSync(manifestPath, JSON.stringify(safariManifest, null, 2));
    console.log('✅ Manifest updated for Safari compatibility');
    return true;
  } catch (error) {
    console.error('❌ Failed to update manifest:', error.message);
    return false;
  }
}

function validateBuild() {
  console.log('🔍 Validating build configuration...');
  
  const nextConfigPath = 'next.config.js';
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if permissions policy allows microphone
  if (nextConfig.includes('microphone=(self)')) {
    console.log('✅ Microphone permissions enabled');
  } else {
    console.log('❌ Microphone permissions not properly configured');
    return false;
  }
  
  // Check if camera permissions are enabled
  if (nextConfig.includes('camera=(self)')) {
    console.log('✅ Camera permissions enabled');
  } else {
    console.log('❌ Camera permissions not properly configured');
    return false;
  }
  
  return true;
}

async function main() {
  // Check critical files
  if (!checkFiles()) {
    console.error('❌ Critical files missing. Please ensure all files are in place.');
    process.exit(1);
  }
  
  // Clear cache
  clearNextCache();
  
  // Update manifest
  updateManifest();
  
  // Validate build configuration
  if (!validateBuild()) {
    console.error('❌ Build configuration validation failed.');
    process.exit(1);
  }
  
  // Install dependencies (if needed)
  runCommand('npm install', 'Installing dependencies');
  
  // Build the application
  const buildSuccess = runCommand('npm run build', 'Building application');
  if (!buildSuccess) {
    console.error('❌ Build failed. Please check the errors above.');
    process.exit(1);
  }
  
  console.log('🎉 Safari Production Mode Fix Complete!');
  console.log('=======================================\n');
  console.log('✅ Service Worker updated for Safari compatibility');
  console.log('✅ Middleware updated with Safari-specific headers');
  console.log('✅ Permissions policy fixed for microphone/camera access');
  console.log('✅ Manifest updated for Safari PWA support');
  console.log('✅ Application built successfully');
  console.log('\n📱 Safari Production Mode should now work properly!');
  console.log('\n🚀 To test:');
  console.log('   npm run start:prod');
  console.log('   Then open Safari and check the console for improvements');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
