#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Directories to search
const searchDirs = [
  'app/api',
  'app/ui',
  'app/lib',
  'app/components',
  'app/dashboard'
];

function hasLoggerUsage(content) {
  return /logger\.(debug|info|warn|error)/g.test(content);
}

function hasLoggerImport(content) {
  return /import.*logger.*from/g.test(content) || /const.*logger.*require/g.test(content);
}

function addLoggerImport(content, filePath) {
  const ext = path.extname(filePath);
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('//')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add at the top after any comments
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line === '' || line.startsWith("'use client'") || line.startsWith('"use client"')) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    lines.splice(insertIndex, 0, "import { logger } from '@/app/lib/logger';");
  } else {
    // Add after the last import
    lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/app/lib/logger';");
  }
  
  return lines.join('\n');
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if no logger usage
    if (!hasLoggerUsage(content)) {
      return false;
    }
    
    // Skip if already has logger import
    if (hasLoggerImport(content)) {
      return false;
    }
    
    console.log(`Adding logger import to: ${filePath}`);
    const updatedContent = addLoggerImport(content, filePath);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
let totalFixed = 0;

for (const searchDir of searchDirs) {
  const fullDir = path.join(process.cwd(), searchDir);
  
  if (!fs.existsSync(fullDir)) {
    console.log(`Directory ${searchDir} does not exist, skipping...`);
    continue;
  }
  
  console.log(`\nProcessing directory: ${searchDir}`);
  const files = walkDirectory(fullDir);
  
  for (const file of files) {
    if (processFile(file)) {
      totalFixed++;
    }
  }
}

console.log(`\n✅ Fixed logger imports in ${totalFixed} files`);
