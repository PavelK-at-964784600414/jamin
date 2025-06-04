#!/usr/bin/env node

/**
 * Console.log cleanup script for production readiness
 * Replaces console statements with production-safe logging
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process
const patterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'auth.ts',
  '!app/lib/logger.ts',
  '!node_modules/**',
  '!.next/**',
  '!scripts/**'
];

// Console method mappings to logger methods
const consoleMappings = {
  'console.log': 'logger.debug',
  'console.info': 'logger.info', 
  'console.warn': 'logger.warn',
  'console.error': 'logger.error'
};

// Component-specific mappings
const componentMappings = {
  'auth.ts': 'auth',
  's3.ts': 's3',
  'audio-mix-server.ts': 'audio'
};

function getComponentLogger(filePath) {
  const fileName = path.basename(filePath);
  for (const [pattern, component] of Object.entries(componentMappings)) {
    if (fileName.includes(pattern.replace('.ts', ''))) {
      return component;
    }
  }
  return null;
}

function addLoggerImport(content) {
  // Check if logger import already exists
  if (content.includes('import') && content.includes('logger')) {
    return content;
  }

  // Find the best place to add the import
  const lines = content.split('\n');
  let insertIndex = 0;

  // Look for existing imports
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      // Skip empty lines after imports
      continue;
    } else if (insertIndex > 0) {
      // Found non-import, non-empty line
      break;
    }
  }

  // Add logger import
  const importStatement = "import { logger } from './lib/logger';";
  if (insertIndex === 0) {
    // No existing imports, add at the top
    lines.unshift(importStatement, '');
  } else {
    lines.splice(insertIndex, 0, importStatement);
  }

  return lines.join('\n');
}

function transformConsoleStatements(content, filePath) {
  const component = getComponentLogger(filePath);
  let transformedContent = content;

  // Regular expression to match console statements
  const consoleRegex = /(console\.(log|info|warn|error))\s*\(\s*([^)]+)\s*\)/g;

  transformedContent = transformedContent.replace(consoleRegex, (match, consoleMethod, logLevel, args) => {
    const loggerMethod = component ? `logger.${component}.${logLevel}` : consoleMappings[consoleMethod] || 'logger.debug';
    
    // Handle error logging specially
    if (logLevel === 'error') {
      // Check if this looks like an error with error object
      if (args.includes('error') || args.includes('Error') || args.includes(':')) {
        // Try to extract message and error parts
        const parts = args.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          const message = parts[0];
          const errorObj = parts.slice(1).join(', ');
          return `${loggerMethod}(${message}, ${errorObj})`;
        }
      }
    }

    return `${loggerMethod}(${args})`;
  });

  return transformedContent;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if no console statements
    if (!content.includes('console.')) {
      return;
    }

    console.log(`Processing: ${filePath}`);

    // Transform console statements
    let transformedContent = transformConsoleStatements(content, filePath);

    // Add logger import if needed
    if (transformedContent !== content) {
      transformedContent = addLoggerImport(transformedContent);
      
      // Write back to file
      fs.writeFileSync(filePath, transformedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Starting console.log cleanup for production readiness...\n');

  // Get all TypeScript/JavaScript files with console statements
  const findCommand = `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | grep -v scripts/cleanup-console-logs.js | xargs grep -l "console\\."`;
  
  let allFiles = [];
  try {
    const output = execSync(findCommand, { encoding: 'utf8' });
    allFiles = output.trim().split('\n').filter(file => file && file.length > 0);
  } catch (error) {
    console.log('No files with console statements found.');
    return;
  }

  console.log(`Found ${allFiles.length} files with console statements...\n`);

  // Process each file
  allFiles.forEach(processFile);

  console.log('\n✨ Console.log cleanup complete!');
  console.log('\n📝 What changed:');
  console.log('  • console.log → logger.debug (hidden in production)');
  console.log('  • console.info → logger.info (hidden in production)');
  console.log('  • console.warn → logger.warn (shown in production)');
  console.log('  • console.error → logger.error (shown in production)');
  console.log('  • Added production-safe logging with sensitive data filtering');
  console.log('\n🚀 Your app is now production-ready with proper logging!');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, transformConsoleStatements, addLoggerImport };
