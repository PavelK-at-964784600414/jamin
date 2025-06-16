// AWS Lambda ffmpeg utilities
import { logger } from '@/app/lib/logger';

/**
 * Get the ffmpeg binary path for AWS Lambda environment
 */
export function getAwsLambdaFfmpegPath(): string {
  logger.debug('[AWS Lambda ffmpeg] Getting ffmpeg path for consistent Lambda-compatible behavior');
  
  // Always try Linux x64 ffmpeg installer first for consistency
  try {
    // Try to construct the path to the Linux x64 binary manually
    const path = require('path');
    const linuxX64Path = path.join(
      require.resolve('@ffmpeg-installer/linux-x64/package.json').replace('/package.json', ''),
      'ffmpeg'
    );
    
    require('fs').accessSync(linuxX64Path, require('fs').constants.F_OK);
    logger.debug(`[AWS Lambda ffmpeg] Using @ffmpeg-installer/linux-x64: ${linuxX64Path}`);
    return linuxX64Path;
  } catch (error) {
    logger.debug('[AWS Lambda ffmpeg] @ffmpeg-installer/linux-x64 not available');
  }
  
  const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL || process.env.FFMPEG_LAMBDA;
  
  if (isLambda) {
    // Try AWS Lambda layer paths (including the deployed ffmpeg layer)
    const lambdaLayerPaths = [
      '/opt/bin/ffmpeg',  // Standard Lambda layer path
      '/opt/ffmpeg/bin/ffmpeg',  // Alternative layer path
      '/tmp/ffmpeg',
      '/var/task/ffmpeg',
      '/var/runtime/ffmpeg'
    ];
    
    logger.debug('[AWS Lambda ffmpeg] Checking Lambda layer paths');
    
    for (const path of lambdaLayerPaths) {
      try {
        require('fs').accessSync(path, require('fs').constants.X_OK);
        logger.debug(`[AWS Lambda ffmpeg] Found executable at: ${path}`);
        return path;
      } catch (error) {
        logger.debug(`[AWS Lambda ffmpeg] Path not accessible: ${path}`);
      }
    }
    
    // Fallback to first lambda path (will be handled by setupAwsLambdaFfmpeg)
    return lambdaLayerPaths[0] || '/opt/bin/ffmpeg';
  }
  
  // Local development fallback - try cross-platform installer
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path) {
      logger.debug(`[AWS Lambda ffmpeg] Using @ffmpeg-installer fallback: ${ffmpegInstaller.path}`);
      return ffmpegInstaller.path;
    }
  } catch (error) {
    logger.warn('[AWS Lambda ffmpeg] @ffmpeg-installer not available, using system ffmpeg');
    return 'ffmpeg'; // System PATH
  }
  
  return 'ffmpeg';
}

/**
 * Download and prepare ffmpeg for AWS Lambda if needed
 */
export async function setupAwsLambdaFfmpeg(): Promise<string> {
  logger.debug('[AWS Lambda ffmpeg] Setting up Lambda-compatible ffmpeg for consistent behavior');
  
  const fs = await import('fs').then(mod => mod.promises);
  const path = await import('path');
  
  // Always try to use the Linux x64 installer binary first for consistency
  try {
    // Try to construct the path to the Linux x64 binary manually
    const path = await import('path');
    const linuxX64Path = path.default.join(
      require.resolve('@ffmpeg-installer/linux-x64/package.json').replace('/package.json', ''),
      'ffmpeg'
    );
    
    // On Linux/Lambda, verify the binary exists and is executable
    try {
      await fs.access(linuxX64Path, require('fs').constants.X_OK);
      logger.debug(`[AWS Lambda ffmpeg] Using @ffmpeg-installer/linux-x64 directly: ${linuxX64Path}`);
      return linuxX64Path;
    } catch (accessError) {
      // On macOS/Windows, the Linux binary exists but isn't executable
      // This is expected and we'll fall back to cross-platform installer
      logger.debug('[AWS Lambda ffmpeg] Linux x64 binary exists but not executable on this platform (expected on macOS/Windows)');
    }
  } catch (error) {
    logger.debug('[AWS Lambda ffmpeg] @ffmpeg-installer/linux-x64 not available:', { metadata: { data: error } });
  }
  
  const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL;
  
  if (isLambda) {
    // In Lambda environment, try to copy Linux binary to /tmp
    const tmpFfmpegPath = '/tmp/ffmpeg';
    
    try {
      // Check if already exists in /tmp
      await fs.access(tmpFfmpegPath, require('fs').constants.X_OK);
      logger.debug('[AWS Lambda ffmpeg] Using existing ffmpeg in /tmp');
      return tmpFfmpegPath;
    } catch (error) {
      logger.debug('[AWS Lambda ffmpeg] ffmpeg not found in /tmp, attempting setup');
    }
    
    // Try to copy from the Linux installer to /tmp
    try {
      const linuxFfmpeg = eval('require')('@ffmpeg-installer/linux-x64');
      if (linuxFfmpeg && linuxFfmpeg.path) {
        await fs.copyFile(linuxFfmpeg.path, tmpFfmpegPath);
        await fs.chmod(tmpFfmpegPath, 0o755);
        logger.debug('[AWS Lambda ffmpeg] Copied Linux x64 ffmpeg to /tmp');
        return tmpFfmpegPath;
      }
    } catch (copyError) {
      logger.warn('[AWS Lambda ffmpeg] Could not copy Linux x64 ffmpeg to /tmp:', { metadata: { data: copyError } });
    }
    
    // Check for Lambda layer paths (including the deployed ffmpeg layer)
    const lambdaPaths = [
      '/opt/bin/ffmpeg',  // Standard Lambda layer path  
      '/opt/ffmpeg/bin/ffmpeg',  // Alternative layer path
      '/var/task/ffmpeg'
    ];
    for (const lambdaPath of lambdaPaths) {
      try {
        await fs.access(lambdaPath, require('fs').constants.X_OK);
        logger.debug(`[AWS Lambda ffmpeg] Found Lambda layer ffmpeg: ${lambdaPath}`);
        return lambdaPath;
      } catch (error) {
        logger.debug(`[AWS Lambda ffmpeg] Lambda path not available: ${lambdaPath}`);
      }
    }
    
    // If we get here, ffmpeg is not available in Lambda
    throw new Error('ffmpeg not available in AWS Lambda environment. Please configure an ffmpeg layer or use client-side audio processing.');
  }
  
  // Local development - use cross-platform installer since Linux binary won't work on macOS/Windows
  logger.debug('[AWS Lambda ffmpeg] Local development: using cross-platform installer');
  try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    if (ffmpegInstaller && ffmpegInstaller.path) {
      await fs.access(ffmpegInstaller.path, require('fs').constants.X_OK);
      logger.debug(`[AWS Lambda ffmpeg] Using cross-platform installer: ${ffmpegInstaller.path}`);
      return ffmpegInstaller.path;
    }
  } catch (error) {
    logger.warn('[AWS Lambda ffmpeg] Cross-platform installer failed:', { metadata: { data: error } });
  }
  
  // Try to find ffmpeg in alternative paths (Next.js build environment)
  const mainPath = await import('path');
  const os = await import('os');
  
  // Platform-specific binary paths for Next.js build environments
  const platform = os.platform();
  const arch = os.arch();
  
  const alternativePaths = [
    // Direct node_modules paths - platform specific
    ...(platform === 'darwin' && arch === 'arm64' ? [
      mainPath.default.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
      mainPath.default.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+darwin-arm64@4.1.0/node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg'),
    ] : []),
    ...(platform === 'darwin' && arch === 'x64' ? [
      mainPath.default.join(process.cwd(), 'node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'),
      mainPath.default.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+darwin-x64@4.1.0/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg'),
    ] : []),
    ...(platform === 'linux' ? [
      mainPath.default.join(process.cwd(), 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
      mainPath.default.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+linux-x64@4.1.0/node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    ] : []),
    
    // Generic cross-platform installer paths
    mainPath.default.join(process.cwd(), 'node_modules/@ffmpeg-installer/ffmpeg/ffmpeg'),
    mainPath.default.join(process.cwd(), 'node_modules/.pnpm/@ffmpeg-installer+ffmpeg@1.1.0/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg'),
    
    // Next.js build output paths
    mainPath.default.join(process.cwd(), '.next/server/chunks/ffmpeg'),
    mainPath.default.join(process.cwd(), '.next/standalone/node_modules/@ffmpeg-installer/linux-x64/ffmpeg'),
    
    // Vercel build paths
    '/vercel/path0/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/var/task/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    
    // System paths
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    'ffmpeg' // System PATH as final fallback
  ];
  
  logger.debug(`[AWS Lambda ffmpeg] Trying alternative paths for platform=${platform}, arch=${arch}...`);
  for (const altPath of alternativePaths) {
    try {
      if (altPath === 'ffmpeg') {
        // For system PATH, just check if command exists
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        await execAsync('which ffmpeg || where ffmpeg', { timeout: 5000 });
        logger.debug(`[AWS Lambda ffmpeg] Found system ffmpeg in PATH`);
        return altPath;
      } else {
        await fs.access(altPath, require('fs').constants.X_OK);
        logger.debug(`[AWS Lambda ffmpeg] Found working ffmpeg at: ${altPath}`);
        return altPath;
      }
    } catch (error) {
      logger.debug(`[AWS Lambda ffmpeg] Path not available: ${altPath}`);
    }
  }
  
  // Final fallback to system ffmpeg
  logger.debug('[AWS Lambda ffmpeg] Falling back to system ffmpeg');
  return 'ffmpeg';
}

/**
 * Check if we're running in an AWS Lambda environment
 */
export function isAwsLambdaEnvironment(): boolean {
  return !!(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV ||
    (process.env.VERCEL && process.env.FFMPEG_LAMBDA)
  );
}

/**
 * Get optimized ffmpeg arguments for AWS Lambda (used consistently for all environments)
 */
export function getAwsLambdaFfmpegArgs(): string[] {
  // Always use Lambda-optimized settings for consistent behavior
  logger.debug('[AWS Lambda ffmpeg] Using Lambda-optimized arguments for all environments');
  
  return [
    '-threads', '1', // Single thread for consistency with Lambda
    '-preset', 'ultrafast', // Fastest encoding
    '-crf', '28', // Reasonable quality/speed balance
    '-movflags', '+faststart', // Web optimization
    '-f', 'mp4' // Force MP4 output for consistency
  ];
}
