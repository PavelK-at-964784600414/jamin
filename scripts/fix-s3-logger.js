#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app/lib/s3.ts');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace logger.s3.* calls with proper logger calls and format
  content = content.replace(/logger\.s3\.debug\('([^']+):', ([^)]+)\)/g, 'logger.debug(\'$1\', { metadata: { data: $2 } })');
  content = content.replace(/logger\.s3\.debug\('([^']+)'\)/g, 'logger.debug(\'$1\')');
  content = content.replace(/logger\.s3\.warn\('([^']+):', ([^)]+)\)/g, 'logger.warn(\'$1\', { metadata: { data: $2 } })');
  content = content.replace(/logger\.s3\.error\('([^']+):', ([^)]+)\)/g, 'logger.error(\'$1\', { metadata: { error: $2 instanceof Error ? $2.message : String($2) } })');
  content = content.replace(/logger\.s3\.error\('([^']+)'\)/g, 'logger.error(\'$1\')');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed s3.ts logger calls');
} catch (error) {
  console.error('❌ Error fixing s3.ts:', error.message);
}
