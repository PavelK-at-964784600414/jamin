#!/usr/bin/env node

/**
 * Comprehensive script to fix all logger issues in the codebase
 */

const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('dist') && !file.includes('build')) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function fixLoggerIssues(content) {
  let fixed = content;

  // 1. Add logger import if logger is used but not imported
  if (fixed.includes('logger.') && !fixed.includes("import { logger }")) {
    // Find the import section and add logger import
    const importPattern = /^import .* from ['"][^'"]*['"];?$/gm;
    const imports = fixed.match(importPattern) || [];
    
    if (imports.length > 0) {
      // Add after the last import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = fixed.indexOf(lastImport) + lastImport.length;
      fixed = fixed.slice(0, lastImportIndex) + "\nimport { logger } from '@/app/lib/logger';" + fixed.slice(lastImportIndex);
    } else {
      // Add at the beginning if it's a client component
      if (fixed.startsWith("'use client'")) {
        const firstLineEnd = fixed.indexOf('\n');
        fixed = fixed.slice(0, firstLineEnd + 1) + "\nimport { logger } from '@/app/lib/logger';" + fixed.slice(firstLineEnd + 1);
      }
    }
  }

  // 2. Fix malformed object literals in logger calls
  // Fix { data: value, 'key' } -> { data: value, key: 'key' }
  fixed = fixed.replace(/(\{ metadata: \{ data: [^,}]+), '([^']+)' \}/g, '$1, unit: \'$2\' }');
  
  // Fix { data: file.name, file.type, file.size } -> { name: file.name, type: file.type, size: file.size }
  fixed = fixed.replace(/\{ data: file\.name, file\.type, file\.size \}/g, '{ name: file.name, type: file.type, size: file.size }');
  
  // Fix malformed nested objects in logger calls
  fixed = fixed.replace(/\{ metadata: \{ data: \{[^}]*\} \}\)/g, (match) => {
    // Try to reconstruct the object properly
    return match.replace(/\{ data: \{/, '{ ').replace(/\} \}\)$/, ' })');
  });

  // 3. Fix logger calls with incorrect object structure
  // logger.error('message', { metadata: { data: { error: ... } } }) -> logger.error('message', { metadata: { error: ... } })
  fixed = fixed.replace(/logger\.(debug|info|warn|error)\('([^']*)', \{ metadata: \{ data: \{([^}]*)\} \}\)/g, 
    'logger.$1(\'$2\', { metadata: { $3 } }');

  return fixed;
}

// Get the project root
const projectRoot = '/Users/pavelklug/Documents/Code/nextjs/jamin';

// Find all TypeScript files
const files = getAllFiles(projectRoot);

let fixedCount = 0;
let filesModified = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  const fixedContent = fixLoggerIssues(content);
  
  if (fixedContent !== originalContent) {
    fs.writeFileSync(file, fixedContent);
    
    filesModified++;
    const relativePath = path.relative(projectRoot, file);
    console.log(`Fixed logger issues in ${relativePath}`);
  }
});

console.log(`\nFixed logger issues in ${filesModified} files`);
