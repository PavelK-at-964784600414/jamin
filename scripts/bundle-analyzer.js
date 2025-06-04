#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function analyzeBundles() {
  logger.debug('📦 Starting Bundle Analysis...\n');

  // Ensure build directory exists
  if (!fs.existsSync('.next')) {
    logger.debug('🔨 Building application first...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  const buildDir = '.next';
  const staticDir = path.join(buildDir, 'static');
  
  if (!fs.existsSync(staticDir)) {
    logger.error('❌ Build directory not found. Please run "npm run build" first.');
    process.exit(1);
  }

  // Analyze build output
  const analysis = {
    timestamp: new Date().toISOString(),
    pages: {},
    chunks: {},
    assets: {},
    summary: {}
  };

  // Analyze pages
  logger.debug('📄 Analyzing pages...');
  const pagesDir = path.join(buildDir, 'server', 'pages');
  if (fs.existsSync(pagesDir)) {
    analysis.pages = analyzeDirectory(pagesDir, 'Pages');
  }

  // Analyze chunks
  logger.debug('🧩 Analyzing chunks...');
  const chunksDir = path.join(staticDir, 'chunks');
  if (fs.existsSync(chunksDir)) {
    analysis.chunks = analyzeDirectory(chunksDir, 'Chunks');
  }

  // Analyze static assets
  logger.debug('🖼️  Analyzing static assets...');
  if (fs.existsSync(staticDir)) {
    analysis.assets = analyzeDirectory(staticDir, 'Static Assets');
  }

  // Generate summary
  analysis.summary = generateSummary(analysis);

  // Save analysis
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(__dirname, `bundle-analysis-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

  // Display results
  displayResults(analysis);

  logger.debug(`\n💾 Full analysis saved to: ${outputPath}`);
  
  return analysis;
}

function analyzeDirectory(dir, category) {
  const files = [];
  const extensions = ['.js', '.css', '.json', '.html'];
  
  function walkDir(currentPath, relativePath = '') {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        walkDir(fullPath, relativeItemPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push({
          name: relativeItemPath,
          size: stats.size,
          sizeKB: Math.round(stats.size / 1024 * 100) / 100,
          extension: path.extname(item),
          category: category
        });
      }
    }
  }
  
  walkDir(dir);
  
  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);
  
  return {
    files,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    totalSizeKB: Math.round(files.reduce((sum, file) => sum + file.size, 0) / 1024 * 100) / 100,
    count: files.length
  };
}

function generateSummary(analysis) {
  const totalSize = (analysis.pages.totalSize || 0) + 
                   (analysis.chunks.totalSize || 0) + 
                   (analysis.assets.totalSize || 0);
  
  const totalSizeKB = Math.round(totalSize / 1024 * 100) / 100;
  const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;

  // Find largest files across all categories
  const allFiles = [
    ...(analysis.pages.files || []),
    ...(analysis.chunks.files || []),
    ...(analysis.assets.files || [])
  ].sort((a, b) => b.size - a.size);

  const largestFiles = allFiles.slice(0, 10);

  // Analyze by file type
  const byExtension = {};
  allFiles.forEach(file => {
    const ext = file.extension || 'unknown';
    if (!byExtension[ext]) {
      byExtension[ext] = { count: 0, totalSize: 0 };
    }
    byExtension[ext].count++;
    byExtension[ext].totalSize += file.size;
  });

  // Convert to array and sort
  const extensionAnalysis = Object.entries(byExtension)
    .map(([ext, data]) => ({
      extension: ext,
      count: data.count,
      totalSize: data.totalSize,
      totalSizeKB: Math.round(data.totalSize / 1024 * 100) / 100,
      averageSize: Math.round(data.totalSize / data.count / 1024 * 100) / 100
    }))
    .sort((a, b) => b.totalSize - a.totalSize);

  return {
    totalSize,
    totalSizeKB,
    totalSizeMB,
    totalFiles: allFiles.length,
    largestFiles,
    byExtension: extensionAnalysis,
    recommendations: generateRecommendations(analysis, totalSizeMB, largestFiles)
  };
}

function generateRecommendations(analysis, totalSizeMB, largestFiles) {
  const recommendations = [];

  // Size-based recommendations
  if (totalSizeMB > 5) {
    recommendations.push('🔴 Bundle size is quite large (>5MB). Consider code splitting and lazy loading.');
  } else if (totalSizeMB > 2) {
    recommendations.push('🟡 Bundle size is moderate (>2MB). Monitor for growth and optimize where possible.');
  } else {
    recommendations.push('🟢 Bundle size looks good (<2MB).');
  }

  // Check for large JavaScript files
  const largeJSFiles = largestFiles.filter(f => f.extension === '.js' && f.sizeKB > 500);
  if (largeJSFiles.length > 0) {
    recommendations.push(`🔴 Found ${largeJSFiles.length} large JavaScript files (>500KB). Consider splitting these.`);
  }

  // Check for large CSS files
  const largeCSSFiles = largestFiles.filter(f => f.extension === '.css' && f.sizeKB > 100);
  if (largeCSSFiles.length > 0) {
    recommendations.push(`🟡 Found ${largeCSSFiles.length} large CSS files (>100KB). Consider CSS purging and splitting.`);
  }

  // Check chunk distribution
  if (analysis.chunks.files && analysis.chunks.files.length > 50) {
    recommendations.push('🟡 Many chunk files detected. Ensure proper chunk optimization strategy.');
  }

  // General recommendations
  recommendations.push('💡 Consider using dynamic imports for route-based code splitting');
  recommendations.push('💡 Implement tree shaking to remove unused code');
  recommendations.push('💡 Use bundle analyzer visualization: npm run build:analyze');
  recommendations.push('💡 Consider lazy loading heavy components and libraries');

  return recommendations;
}

function displayResults(analysis) {
  logger.debug('\n📊 Bundle Analysis Results:');
  logger.debug('========================\n');

  // Summary
  logger.debug(`📦 Total Bundle Size: ${analysis.summary.totalSizeMB} MB (${analysis.summary.totalSizeKB} KB)`);
  logger.debug(`📁 Total Files: ${analysis.summary.totalFiles}\n`);

  // By category
  if (analysis.pages.files) {
    logger.debug(`📄 Pages: ${analysis.pages.count} files, ${analysis.pages.totalSizeKB} KB`);
  }
  if (analysis.chunks.files) {
    logger.debug(`🧩 Chunks: ${analysis.chunks.count} files, ${analysis.chunks.totalSizeKB} KB`);
  }
  if (analysis.assets.files) {
    logger.debug(`🖼️  Assets: ${analysis.assets.count} files, ${analysis.assets.totalSizeKB} KB`);
  }

  // Largest files
  logger.debug('\n🔝 Top 10 Largest Files:');
  analysis.summary.largestFiles.slice(0, 10).forEach((file, index) => {
    logger.debug(`   ${index + 1}. ${file.name} - ${file.sizeKB} KB`);
  });

  // By extension
  logger.debug('\n📋 By File Type:');
  analysis.summary.byExtension.slice(0, 5).forEach(ext => {
    logger.debug(`   ${ext.extension}: ${ext.count} files, ${ext.totalSizeKB} KB (avg: ${ext.averageSize} KB)`);
  });

  // Recommendations
  logger.debug('\n💡 Recommendations:');
  analysis.summary.recommendations.forEach(rec => {
    logger.debug(`   ${rec}`);
  });
}

// Run analysis if called directly
if (require.main === module) {
  analyzeBundles()
    .then(() => {
      logger.debug('\n✨ Bundle analysis completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n💥 Bundle analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { analyzeBundles };
