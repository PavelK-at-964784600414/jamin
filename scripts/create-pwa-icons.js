import { logger } from './lib/logger';

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple PNG icon using data URL
function createIcon(size, filename) {
  // Create a simple canvas-like SVG that can be converted
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="${size}" height="${size}" fill="#0f0f23" rx="${size * 0.15}"/>
    
    <!-- Musical note design -->
    <g transform="translate(${size * 0.25}, ${size * 0.19})">
      <!-- Main note stem -->
      <rect x="${size * 0.35}" y="${size * 0.08}" width="${size * 0.03}" height="${size * 0.55}" fill="url(#gradient)"/>
      
      <!-- Note head -->
      <ellipse cx="${size * 0.305}" cy="${size * 0.625}" rx="${size * 0.0625}" ry="${size * 0.047}" fill="url(#gradient)" transform="rotate(-20 ${size * 0.305} ${size * 0.625})"/>
      
      <!-- Flag -->
      <path d="M${size * 0.383} ${size * 0.08} Q${size * 0.547} ${size * 0.039} ${size * 0.625} ${size * 0.156} Q${size * 0.586} ${size * 0.234} ${size * 0.469} ${size * 0.273} Q${size * 0.43} ${size * 0.234} ${size * 0.383} ${size * 0.195} Z" fill="url(#gradient)" opacity="0.8"/>
      
      <!-- Sound waves -->
      <g stroke="url(#gradient)" stroke-width="${size * 0.016}" fill="none" opacity="0.6">
        <path d="M${size * 0.117} ${size * 0.352} Q${size * 0.156} ${size * 0.313} ${size * 0.195} ${size * 0.352} Q${size * 0.234} ${size * 0.391} ${size * 0.273} ${size * 0.352}"/>
        <path d="M${size * 0.117} ${size * 0.43} Q${size * 0.156} ${size * 0.391} ${size * 0.195} ${size * 0.43} Q${size * 0.234} ${size * 0.469} ${size * 0.273} ${size * 0.43}"/>
        <path d="M${size * 0.117} ${size * 0.508} Q${size * 0.156} ${size * 0.469} ${size * 0.195} ${size * 0.508} Q${size * 0.234} ${size * 0.547} ${size * 0.273} ${size * 0.508}"/>
      </g>
      
      <!-- Collaboration symbol -->
      <circle cx="${size * 0.156}" cy="${size * 0.234}" r="${size * 0.047}" fill="url(#gradient)" opacity="0.7"/>
      <circle cx="${size * 0.234}" cy="${size * 0.273}" r="${size * 0.047}" fill="url(#gradient)" opacity="0.7"/>
      <circle cx="${size * 0.195}" cy="${size * 0.352}" r="${size * 0.047}" fill="url(#gradient)" opacity="0.7"/>
    </g>
    
    <!-- Brand text -->
    <text x="${size * 0.5}" y="${size * 0.898}" font-family="Arial, sans-serif" font-size="${size * 0.094}" font-weight="bold" text-anchor="middle" fill="url(#gradient)">
      JAMIN
    </text>
  </svg>`;

  // Write the SVG file
  fs.writeFileSync(path.join(__dirname, '..', 'public', filename.replace('.png', '.svg')), svg);
  
  logger.debug(`Created ${filename.replace('.png', '.svg')} (${size}x${size})`);
}

// Create the required icon sizes
createIcon(192, 'icon-192x192.png');
createIcon(512, 'icon-512x512.png');

logger.debug('✅ PWA icon SVGs created successfully!');
logger.debug('📝 Note: SVG files created. For production, convert these to PNG files using an online converter or ImageMagick.');
logger.debug('   Online converters: https://convertio.co/svg-png/ or https://cloudconvert.com/svg-to-png');
