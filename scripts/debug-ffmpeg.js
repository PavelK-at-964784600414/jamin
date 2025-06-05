// Debug script to check environment and ffmpeg availability
// Usage: node scripts/debug-ffmpeg.js

const fs = require('fs');
const path = require('path');

console.log('=== Environment Debug Information ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Platform:', process.platform);
console.log('Current working directory:', process.cwd());
console.log('');

console.log('=== Package Manager Configuration ===');
console.log('PNPM Config Unsafe Perm:', process.env.PNPM_CONFIG_UNSAFE_PERM);
console.log('NPM Config Unsafe Perm:', process.env.NPM_CONFIG_UNSAFE_PERM);
console.log('Enable Build Scripts:', process.env.ENABLE_BUILD_SCRIPTS);
console.log('');

console.log('=== ffmpeg-static Investigation ===');

// Test 1: Try requiring ffmpeg-static
try {
  const ffmpegStatic = require('ffmpeg-static');
  console.log('✅ ffmpeg-static require successful');
  console.log('   Path:', ffmpegStatic);
  
  // Test if file exists
  if (fs.existsSync(ffmpegStatic)) {
    console.log('✅ ffmpeg binary file exists');
    const stats = fs.statSync(ffmpegStatic);
    console.log('   Size:', stats.size, 'bytes');
    console.log('   Executable:', !!(stats.mode & parseInt('111', 8)));
  } else {
    console.log('❌ ffmpeg binary file does not exist');
  }
} catch (error) {
  console.log('❌ ffmpeg-static require failed:', error.message);
}

console.log('');
console.log('=== Fallback Path Investigation ===');

const fallbackPaths = [
  path.join(process.cwd(), 'node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg'),
  path.join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
  path.join('/vercel/path0/node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg'),
  path.join('/vercel/path0/node_modules/ffmpeg-static/ffmpeg'),
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg'
];

fallbackPaths.forEach((testPath, index) => {
  try {
    fs.accessSync(testPath, fs.constants.F_OK);
    console.log(`✅ Fallback ${index + 1}: ${testPath}`);
  } catch (error) {
    console.log(`❌ Fallback ${index + 1}: ${testPath} (not accessible)`);
  }
});

console.log('');
console.log('=== Node Modules Structure ===');

// Check node_modules structure
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules exists');
  
  // Check for .pnpm folder
  const pnpmPath = path.join(nodeModulesPath, '.pnpm');
  if (fs.existsSync(pnpmPath)) {
    console.log('✅ .pnpm folder exists');
    
    // Look for ffmpeg-static folders
    try {
      const pnpmContents = fs.readdirSync(pnpmPath);
      const ffmpegFolders = pnpmContents.filter(item => item.includes('ffmpeg-static'));
      if (ffmpegFolders.length > 0) {
        console.log('✅ Found ffmpeg-static folders:', ffmpegFolders);
      } else {
        console.log('❌ No ffmpeg-static folders found in .pnpm');
      }
    } catch (error) {
      console.log('❌ Error reading .pnpm contents:', error.message);
    }
  } else {
    console.log('❌ .pnpm folder does not exist');
  }
  
  // Check for direct ffmpeg-static
  const directPath = path.join(nodeModulesPath, 'ffmpeg-static');
  if (fs.existsSync(directPath)) {
    console.log('✅ Direct ffmpeg-static folder exists');
  } else {
    console.log('❌ Direct ffmpeg-static folder does not exist');
  }
} else {
  console.log('❌ node_modules does not exist');
}

console.log('');
console.log('=== Recommendations ===');
console.log('If ffmpeg-static is not working in production:');
console.log('1. Ensure build scripts are enabled in Vercel');
console.log('2. Check that pnpm.onlyBuiltDependencies includes "ffmpeg-static"');
console.log('3. Verify .npmrc has unsafe-perm=true');
console.log('4. The application will gracefully handle missing ffmpeg by throwing an error');
