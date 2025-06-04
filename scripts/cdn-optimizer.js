import { logger } from './lib/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CDN and Static Asset Optimization Configuration
const cdnConfig = {
  // Example CDN configurations for different providers
  cloudflare: {
    cacheRules: [
      {
        pattern: '/_next/static/*',
        ttl: 31536000, // 1 year
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      },
      {
        pattern: '/images/*',
        ttl: 86400, // 1 day
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      },
      {
        pattern: '/manifest.json',
        ttl: 3600, // 1 hour
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    ],
    compression: {
      brotli: true,
      gzip: true,
      minify: {
        html: true,
        css: true,
        js: true
      }
    }
  },
  
  aws: {
    s3: {
      bucketPolicy: {
        staticAssets: {
          cacheTtl: 31536000,
          compress: true
        },
        dynamicContent: {
          cacheTtl: 0,
          compress: false
        }
      }
    },
    cloudfront: {
      distributions: [
        {
          origin: 's3-static-assets',
          behaviors: {
            '/_next/static/*': {
              cachePolicyId: 'managed-caching-optimized',
              compress: true,
              viewerProtocolPolicy: 'redirect-to-https'
            },
            '/images/*': {
              cachePolicyId: 'managed-caching-optimized-for-uncompressed-objects',
              compress: true
            }
          }
        }
      ]
    }
  },
  
  vercel: {
    headers: [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ]
  }
};

// Generate optimized asset configurations
function generateAssetOptimization() {
  logger.debug('🌐 Generating CDN and Asset Optimization Configuration\n');
  
  const optimization = {
    timestamp: new Date().toISOString(),
    recommendations: [],
    configurations: {},
    assetAnalysis: {}
  };

  // Analyze current static assets
  const publicDir = path.join(process.cwd(), 'public');
  const buildDir = path.join(process.cwd(), '.next', 'static');
  
  if (fs.existsSync(publicDir)) {
    optimization.assetAnalysis.public = analyzeAssetDirectory(publicDir);
  }
  
  if (fs.existsSync(buildDir)) {
    optimization.assetAnalysis.build = analyzeAssetDirectory(buildDir);
  }

  // Generate recommendations
  optimization.recommendations = generateOptimizationRecommendations(optimization.assetAnalysis);
  
  // Generate CDN configurations
  optimization.configurations = {
    nextjs: generateNextJSConfig(),
    nginx: generateNginxConfig(),
    cloudflare: generateCloudflareConfig(),
    vercel: generateVercelConfig()
  };

  return optimization;
}

function analyzeAssetDirectory(directory) {
  const analysis = {
    totalFiles: 0,
    totalSize: 0,
    byType: {},
    largeFiles: [],
    unoptimized: []
  };

  function walkDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        walkDirectory(fullPath, itemRelativePath);
      } else {
        analysis.totalFiles++;
        analysis.totalSize += stats.size;
        
        const ext = path.extname(item).toLowerCase();
        if (!analysis.byType[ext]) {
          analysis.byType[ext] = { count: 0, size: 0 };
        }
        analysis.byType[ext].count++;
        analysis.byType[ext].size += stats.size;
        
        // Check for large files (>1MB)
        if (stats.size > 1024 * 1024) {
          analysis.largeFiles.push({
            path: itemRelativePath,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100
          });
        }
        
        // Check for unoptimized files
        if (isUnoptimized(item, stats.size)) {
          analysis.unoptimized.push({
            path: itemRelativePath,
            size: stats.size,
            reason: getOptimizationReason(item, stats.size)
          });
        }
      }
    }
  }
  
  walkDirectory(directory);
  
  return analysis;
}

function isUnoptimized(filename, size) {
  const ext = path.extname(filename).toLowerCase();
  
  // Check for large images
  if (['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext) && size > 500 * 1024) {
    return true;
  }
  
  // Check for uncompressed JavaScript
  if (ext === '.js' && !filename.includes('.min.') && size > 100 * 1024) {
    return true;
  }
  
  // Check for uncompressed CSS
  if (ext === '.css' && !filename.includes('.min.') && size > 50 * 1024) {
    return true;
  }
  
  return false;
}

function getOptimizationReason(filename, size) {
  const ext = path.extname(filename).toLowerCase();
  
  if (['.png', '.jpg', '.jpeg', '.gif', '.bmp'].includes(ext) && size > 500 * 1024) {
    return 'Large image file - consider compression or WebP format';
  }
  
  if (ext === '.js' && !filename.includes('.min.') && size > 100 * 1024) {
    return 'Large JavaScript file - consider minification and compression';
  }
  
  if (ext === '.css' && !filename.includes('.min.') && size > 50 * 1024) {
    return 'Large CSS file - consider minification and purging unused styles';
  }
  
  return 'Consider optimization';
}

function generateOptimizationRecommendations(assetAnalysis) {
  const recommendations = [];
  
  // Analyze total asset size
  const totalSize = Object.values(assetAnalysis).reduce((sum, analysis) => sum + (analysis.totalSize || 0), 0);
  const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
  
  if (totalSizeMB > 50) {
    recommendations.push('🔴 Very large asset bundle (>50MB) - implement aggressive optimization');
  } else if (totalSizeMB > 20) {
    recommendations.push('🟡 Large asset bundle (>20MB) - consider optimization strategies');
  } else {
    recommendations.push('🟢 Asset bundle size looks reasonable');
  }
  
  // Check for unoptimized files
  const unoptimizedFiles = Object.values(assetAnalysis)
    .flatMap(analysis => analysis.unoptimized || []);
  
  if (unoptimizedFiles.length > 0) {
    recommendations.push(`⚠️  Found ${unoptimizedFiles.length} unoptimized files`);
  }
  
  // General recommendations
  recommendations.push('💡 Use Next.js Image component for automatic optimization');
  recommendations.push('💡 Enable Brotli compression on your CDN');
  recommendations.push('💡 Implement proper cache headers for static assets');
  recommendations.push('💡 Consider using a CDN for global asset delivery');
  recommendations.push('💡 Use WebP/AVIF formats for images when supported');
  
  return recommendations;
}

function generateNextJSConfig() {
  return `
// next.config.js - Additional optimizations
module.exports = {
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Headers for static assets
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};`;
}

function generateNginxConfig() {
  return `
# nginx.conf - Asset optimization
server {
    listen 80;
    server_name your-domain.com;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Brotli compression (if available)
    brotli on;
    brotli_comp_level 4;
    brotli_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Static asset caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /images/ {
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Service worker (no cache)
    location /sw.js {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}`;
}

function generateCloudflareConfig() {
  return {
    pageRules: [
      {
        targets: [
          {
            target: "url",
            constraint: {
              operator: "matches",
              value: "*/_next/static/*"
            }
          }
        ],
        actions: [
          {
            id: "cache_level",
            value: "cache_everything"
          },
          {
            id: "edge_cache_ttl",
            value: 31536000
          }
        ]
      }
    ],
    speed: {
      minify: {
        css: "on",
        html: "on",
        js: "on"
      },
      compression: "gzip"
    }
  };
}

function generateVercelConfig() {
  return `
// vercel.json - Asset optimization
{
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ],
  "functions": {
    "app/api/analytics/route.ts": {
      "maxDuration": 10
    }
  }
}`;
}

// Main execution
if (require.main === module) {
  logger.debug('🎯 CDN and Asset Optimization Analysis');
  logger.debug('====================================\n');
  
  const optimization = generateAssetOptimization();
  
  // Display results
  logger.debug('📊 Asset Analysis:');
  Object.entries(optimization.assetAnalysis).forEach(([type, analysis]) => {
    logger.debug(`  ${type}: ${analysis.totalFiles} files, ${Math.round(analysis.totalSize / 1024 / 1024 * 100) / 100} MB`);
    
    if (analysis.largeFiles && analysis.largeFiles.length > 0) {
      logger.debug(`    Large files (>1MB): ${analysis.largeFiles.length}`);
    }
    
    if (analysis.unoptimized && analysis.unoptimized.length > 0) {
      logger.debug(`    Unoptimized files: ${analysis.unoptimized.length}`);
    }
  });
  
  logger.debug('\n💡 Recommendations:');
  optimization.recommendations.forEach(rec => {
    logger.debug(`  ${rec}`);
  });
  
  // Save configurations
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(__dirname, `cdn-optimization-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(optimization, null, 2));
  
  logger.debug(`\n💾 Optimization configurations saved to: ${outputPath}`);
  logger.debug('\n✨ CDN optimization analysis completed!');
}

module.exports = { generateAssetOptimization };`;
