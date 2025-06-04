#!/usr/bin/env node

/**
 * Script to fix logger calls that use the old format with multiple arguments
 * Converts logger.method('message:', data) to logger.method('message', { metadata: data })
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

function fixLoggerCalls(content) {
  // Pattern to match logger calls with the old format: logger.method('message:', something)
  const oldFormatPattern = /logger\.(debug|info|warn|error)\(\s*(['"][^'"]*):(['"]\s*,\s*[^)]+)\)/g;
  
  return content.replace(oldFormatPattern, (match, level, messageWithQuote, rest) => {
    // Extract the message and data parts
    const parts = match.match(/logger\.(debug|info|warn|error)\(\s*(['"])([^'"]*):(['"])\s*,\s*([^)]+)\)/);
    if (!parts) return match;
    
    const [, logLevel, quote1, message, quote2, data] = parts;
    const cleanData = data.trim();
    
    // If data looks like a simple error or variable, wrap it properly
    if (cleanData === 'error' || cleanData.includes('Error') || cleanData.includes('validationError')) {
      return `logger.${logLevel}(${quote1}${message}${quote2}, { metadata: { error: ${cleanData} instanceof Error ? ${cleanData}.message : String(${cleanData}) } })`;
    } else {
      return `logger.${logLevel}(${quote1}${message}${quote2}, { metadata: { data: ${cleanData} } })`;
    }
  });
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
  
  const fixedContent = fixLoggerCalls(content);
  
  if (fixedContent !== originalContent) {
    fs.writeFileSync(file, fixedContent);
    
    // Count fixes in this file
    const fixes = (originalContent.match(/logger\.(debug|info|warn|error)\([^)]*:[^)]*,/g) || []).length;
    fixedCount += fixes;
    filesModified++;
    
    const relativePath = path.relative(projectRoot, file);
    console.log(`Fixed ${fixes} logger calls in ${relativePath}`);
  }
});

console.log(`\nFixed ${fixedCount} logger calls across ${filesModified} files`);
