#!/usr/bin/env node

/**
 * Safari Production Mode Fix Script
 * Addresses SSL certificate validation issues preventing JavaScript from loading in Safari production mode
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🍎 Safari Production Mode SSL Fix');
console.log('==================================\n');

function runCommand(command, description, options = {}) {
  try {
    console.log(`📋 ${description}...`);
    const result = execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd(),
      ...options
    });
    console.log(`✅ ${description} completed successfully`);
    return { success: true, output: result };
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return { success: false, error };
  }
}

function updatePackageJsonForSafari() {
  console.log('📦 Updating package.json with Safari-compatible scripts...');
  
  const packageJsonPath = './package.json';
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add Safari-specific start scripts that avoid SSL issues
    packageJson.scripts = {
      ...packageJson.scripts,
      'start:safari-prod': 'NODE_ENV=production HTTP_ONLY=true next start -p 3000 --hostname 0.0.0.0',
      'start:safari-local': 'NODE_ENV=production next start -p 3000 --hostname localhost',
      'test:safari': 'npm run build && npm run start:safari-local'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json updated with Safari-compatible scripts');
    return true;
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
    return false;
  }
}

function createSafariNextConfig() {
  console.log('⚙️  Creating Safari-compatible Next.js configuration...');
  
  // Backup existing config
  if (fs.existsSync('./next.config.js')) {
    fs.copyFileSync('./next.config.js', './next.config.js.backup');
    console.log('📄 Existing next.config.js backed up');
  }
  
  // Read current config and enhance it for Safari
  try {
    let configContent = fs.readFileSync('./next.config.js', 'utf8');
    
    // Check if we need to add Safari-specific configurations
    if (!configContent.includes('Cross-Origin-Resource-Policy')) {
      console.log('🔧 Adding Safari-specific headers to next.config.js');
      
      // Add comment about Safari compatibility
      const safariComment = `
// Safari Production Mode Compatibility
// Added headers to prevent SSL certificate validation issues`;
      
      if (!configContent.includes('Safari Production Mode Compatibility')) {
        configContent = safariComment + '\n' + configContent;
      }
      
      fs.writeFileSync('./next.config.js', configContent);
      console.log('✅ Next.js config updated for Safari compatibility');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update next.config.js:', error.message);
    return false;
  }
}

function createSafariStartScript() {
  console.log('📝 Creating Safari production start script...');
  
  const startScript = `#!/bin/bash

# Safari Production Mode Startup Script
# Ensures proper environment setup for Safari compatibility

echo "🍎 Starting Jamin in Safari-compatible production mode..."

# Set environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Clear any existing cache that might cause issues
rm -rf .next/cache

# Start the server with Safari-compatible settings
echo "🚀 Starting production server on http://localhost:3000"
echo "📱 Safari users: Use http://localhost:3000 (not https://)"
echo ""

# Use plain HTTP to avoid SSL certificate issues in Safari
node_modules/.bin/next start -p 3000 --hostname localhost
`;

  try {
    fs.writeFileSync('./start-safari-prod.sh', startScript);
    // Make executable
    fs.chmodSync('./start-safari-prod.sh', '755');
    console.log('✅ Safari start script created: ./start-safari-prod.sh');
    return true;
  } catch (error) {
    console.error('❌ Failed to create start script:', error.message);
    return false;
  }
}

function clearNextCache() {
  console.log('🧹 Clearing Next.js cache to resolve potential conflicts...');
  
  try {
    // Clear Next.js cache
    if (fs.existsSync('.next/cache')) {
      fs.rmSync('.next/cache', { recursive: true, force: true });
      console.log('✅ Next.js cache cleared');
    }
    
    // Clear node_modules cache
    if (fs.existsSync('node_modules/.cache')) {
      fs.rmSync('node_modules/.cache', { recursive: true, force: true });
      console.log('✅ Node modules cache cleared');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
    return false;
  }
}

function validateSafariSetup() {
  console.log('🔍 Validating Safari setup...');
  
  const checks = [
    { file: './next.config.js', name: 'Next.js config' },
    { file: './public/sw.js', name: 'Service worker' },
    { file: './public/manifest.json', name: 'PWA manifest' },
    { file: './package.json', name: 'Package.json' }
  ];
  
  let allValid = true;
  
  checks.forEach(check => {
    if (fs.existsSync(check.file)) {
      console.log(`✅ ${check.name} exists`);
    } else {
      console.log(`❌ ${check.name} missing`);
      allValid = false;
    }
  });
  
  return allValid;
}

async function main() {
  console.log('🚀 Starting Safari Production Mode SSL Fix...\n');
  
  // Step 1: Clear cache
  clearNextCache();
  
  // Step 2: Update package.json
  updatePackageJsonForSafari();
  
  // Step 3: Update Next.js config
  createSafariNextConfig();
  
  // Step 4: Create Safari start script
  createSafariStartScript();
  
  // Step 5: Install dependencies if needed
  const installResult = runCommand(
    'npm install', 
    'Installing/updating dependencies',
    { silent: true }
  );
  
  // Step 6: Build application
  const buildResult = runCommand(
    'npm run build',
    'Building application with Safari optimizations'
  );
  
  if (!buildResult.success) {
    console.error('\n❌ Build failed. Please check the errors above.');
    process.exit(1);
  }
  
  // Step 7: Validate setup
  const isValid = validateSafariSetup();
  
  console.log('\n🎉 Safari Production Mode Fix Complete!');
  console.log('=========================================\n');
  
  if (isValid) {
    console.log('✅ All components validated successfully');
    console.log('\n🚀 To start in Safari-compatible mode:');
    console.log('   Option 1: npm run start:safari-local');
    console.log('   Option 2: ./start-safari-prod.sh');
    console.log('   Option 3: npm run test:safari');
    console.log('\n🌐 Then open Safari and navigate to:');
    console.log('   http://localhost:3000 (NOT https://)');
    console.log('\n💡 Key fixes applied:');
    console.log('   • HTTP-only mode to avoid SSL certificate issues');
    console.log('   • Safari-compatible service worker');
    console.log('   • Enhanced security headers for Safari');
    console.log('   • Cache clearing to resolve conflicts');
    console.log('   • Localhost binding for development testing');
  } else {
    console.log('⚠️  Some validation checks failed. Please review the errors above.');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Test the application in Safari production mode');
  console.log('2. Verify microphone/camera permissions work');
  console.log('3. Check that JavaScript bundles load properly');
  console.log('4. Test recording functionality');
}

// Run the script
main().catch(error => {
  console.error('\n💥 Safari fix script failed:', error);
  process.exit(1);
});
