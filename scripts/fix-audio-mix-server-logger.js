#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/lib/audio-mix-server.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all logger.audio.* calls with proper logger calls
  content = content.replace(/logger\.audio\.log\(/g, 'logger.debug(');
  content = content.replace(/logger\.audio\.error\(/g, 'logger.error(');
  content = content.replace(/logger\.audio\.warn\(/g, 'logger.warn(');
  content = content.replace(/logger\.audio\.info\(/g, 'logger.info(');
  
  // Fix specific logger calls that don't match our interface
  // Find logger calls that pass raw strings as second parameter
  content = content.replace(
    /logger\.(debug|info|warn|error)\(([^,]+), ([^,{}][^,)]*)\)/g,
    'logger.$1($2, { metadata: { data: $3 } })'
  );
  
  // Fix logger.error calls with just the error object
  content = content.replace(
    /logger\.error\(([^,]+), (error|err|statError|ffmpegError)\)/g,
    'logger.error($1, { metadata: { error: $2 instanceof Error ? $2.message : String($2) } })'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed audio-mix-server.ts logger calls');
} catch (error) {
  console.error('❌ Error fixing audio-mix-server.ts:', error.message);
}
