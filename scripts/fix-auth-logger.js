#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'auth.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all logger.auth.* calls with proper logger calls
  content = content.replace(/logger\.auth\.debug\(/g, 'logger.debug(');
  content = content.replace(/logger\.auth\.error\(/g, 'logger.error(');
  content = content.replace(/logger\.auth\.warn\(/g, 'logger.warn(');
  content = content.replace(/logger\.auth\.info\(/g, 'logger.info(');
  
  // Fix the specific multi-parameter logger calls
  // Convert logger.debug('message', param1, 'text', param2, 'text', param3) to proper format
  content = content.replace(
    /logger\.debug\(\s*'([^']+)',\s*([^,]+),\s*'([^']+)',\s*([^,]+),\s*'([^']+)',\s*([^)]+)\s*\)/g,
    "logger.debug('$1', { metadata: { path: $2, message1: '$3', value1: $4, message2: '$5', value2: $6 } })"
  );
  
  // Fix logger calls with too many string parameters
  content = content.replace(
    /logger\.debug\(\s*'([^']+)',\s*([^,]+),\s*'([^']+)',\s*([^)]+)\s*\)/g,
    "logger.debug('$1', { metadata: { path: $2, message: '$3', value: $4 } })"
  );
  
  // Fix single parameter logger calls (remove the first debug call that crashes)
  content = content.replace(
    /logger\.debug\("AUTH\.TS IS BEING PROCESSED - TOP OF FILE"\);/g,
    'logger.debug("AUTH.TS IS BEING PROCESSED - TOP OF FILE");'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed auth.ts logger calls');
} catch (error) {
  console.error('❌ Error fixing auth.ts:', error.message);
}
