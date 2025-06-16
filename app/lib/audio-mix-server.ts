import mainPath from 'path'; // aliased to mainPath to avoid conflict with the path module imported later
import fsPromises from 'fs/promises'; // Import fs.promises directly
import { logger } from '@/app/lib/logger';
import { setupAwsLambdaFfmpeg, getAwsLambdaFfmpegArgs, isAwsLambdaEnvironment } from '@/app/lib/aws-lambda-ffmpeg';
// Server-only audio mixing utilities for Next.js (Node.js only) with AWS Lambda support

const nodeEnv = process.env.NODE_ENV;
const isLambda = isAwsLambdaEnvironment();

let ffmpegExecutablePath: string;

logger.debug(`[audio-mix-server] Initializing: NODE_ENV = "${nodeEnv}", AWS Lambda = ${isLambda}`);

// Initialize ffmpeg path for AWS Lambda or traditional environments
async function initializeFfmpegPath(): Promise<string> {
  // Always use AWS Lambda-compatible ffmpeg for consistent behavior
  logger.debug('[audio-mix-server] Using AWS Lambda-compatible ffmpeg for all environments');
  return await setupAwsLambdaFfmpeg();
}

// Initialize the path (will be resolved when first used)
let ffmpegPathPromise: Promise<string> | null = null;

/**
 * Mix two audio files by downloading them, combining using ffmpeg, and uploading the result to S3.
 * @param originalUrl URL of the original theme audio
 * @param layerUrl URL of the new layer audio
 * @returns URL of the mixed audio file
 */
export async function mixAudioFiles(originalUrl: string, layerUrl: string): Promise<string> {
  const os = await import('os');
  const path = await import('path'); // This is the standard path module
  const fs = await import('fs').then(mod => mod.promises);
  const { promisify } = await import('util');
  const exec = promisify((await import('child_process')).exec);

  // Verify ffmpeg path just before use
  if (!ffmpegPathPromise) {
    ffmpegPathPromise = initializeFfmpegPath();
  }
  
  const ffmpegExecutablePath = await ffmpegPathPromise;
  
  try {
    await fsPromises.stat(ffmpegExecutablePath);
    logger.debug(`[mixAudioFiles] Verified: ffmpeg executable exists at: ${ffmpegExecutablePath}`);
  } catch (statError) {
    logger.error(`[mixAudioFiles] CRITICAL ERROR: ffmpeg path failed: ${ffmpegExecutablePath}`, { metadata: { data: statError } });
    
    // For AWS Lambda, try re-initializing
    if (isLambda) {
      try {
        const newPath = await setupAwsLambdaFfmpeg();
        ffmpegPathPromise = Promise.resolve(newPath);
        logger.debug(`[mixAudioFiles] Re-initialized AWS Lambda ffmpeg path: ${newPath}`);
        // Verify the new path works
        await fsPromises.stat(newPath);
      } catch (reinitError) {
        const errorMessage = `ffmpeg not available in AWS Lambda environment. Falling back to layer audio without mixing.`;
        logger.error(`[mixAudioFiles] ${errorMessage}`, { 
          metadata: { 
            attempted_path: ffmpegExecutablePath,
            lambda_environment: isLambda,
            node_env: process.env.NODE_ENV,
            aws_execution_env: process.env.AWS_EXECUTION_ENV,
            current_working_directory: process.cwd()
          }
        });
        // Instead of throwing, return the layer URL as fallback
        logger.warn('[mixAudioFiles] Falling back to layer recording without mixing');
        return layerUrl;
      }
    } else {
      const errorMessage = `ffmpeg not available. Falling back to layer audio without mixing.`;
      logger.error(`[mixAudioFiles] ${errorMessage}`, { 
        metadata: { 
          attempted_path: ffmpegExecutablePath,
          node_env: process.env.NODE_ENV,
          current_working_directory: process.cwd(),
          platform: process.platform,
          arch: process.arch
        }
      });
      
      // Instead of throwing, return the layer URL as fallback
      logger.warn('[mixAudioFiles] Falling back to layer recording without mixing');
      return layerUrl;
    }
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jamimix-'));
  const originalPath = path.join(tmpDir, 'original.webm');
  const layerPath = path.join(tmpDir, 'layer.webm');
  const baseOutputPath = path.join(tmpDir, 'mixed');
  const outputPath = `${baseOutputPath}.mp4`; // Always use MP4 for consistency

  logger.debug(`Temporary directory created: ${tmpDir}`);
  logger.debug(`Original audio will be saved to: ${originalPath}`);
  logger.debug(`Layer audio will be saved to: ${layerPath}`);
  logger.debug(`Mixed output will be saved to: ${outputPath}`);

  try {
    // Download and write original audio
    logger.debug(`Downloading original audio from: ${originalUrl}`);
    const origRes = await fetch(originalUrl);
    if (!origRes.ok) throw new Error(`Failed to download original audio: ${origRes.status} ${origRes.statusText}`);
    const origBuf = await origRes.arrayBuffer();
    await fs.writeFile(originalPath, new Uint8Array(Buffer.from(origBuf)));
    logger.debug(`Original audio downloaded and saved successfully. Size: ${origBuf.byteLength} bytes`);

    // Download and write layer audio
    logger.debug(`Downloading layer audio from: ${layerUrl}`);
    const layerRes = await fetch(layerUrl);
    if (!layerRes.ok) throw new Error(`Failed to download layer audio: ${layerRes.status} ${layerRes.statusText}`);
    const layerBuf = await layerRes.arrayBuffer();
    await fs.writeFile(layerPath, new Uint8Array(Buffer.from(layerBuf)));
    logger.debug(`Layer audio downloaded and saved successfully. Size: ${layerBuf.byteLength} bytes`);

    // Construct and execute ffmpeg command using AWS Lambda optimizations (consistent for all environments)
    const lambdaArgs = getAwsLambdaFfmpegArgs();
    const baseCommand = `${ffmpegExecutablePath} -y -i "${originalPath}" -i "${layerPath}"`;
    const filterCommand = `-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest"`;
    const outputArgs = lambdaArgs.join(' ');
    const outputFormat = 'mp4'; // Always use MP4 for consistency
    const outputExtension = '.mp4';
    
    // Update output path based on format
    const finalOutputPath = outputPath.replace('.webm', outputExtension);
    
    const ffmpegCommand = `${baseCommand} ${filterCommand} ${outputArgs} "${finalOutputPath}"`;
    logger.debug(`[mixAudioFiles] Executing ffmpeg command: ${ffmpegCommand}`);
    logger.debug(`[mixAudioFiles] Using Lambda-compatible mode for all environments, Output format: ${outputFormat}`);
    
    try {
      const { stdout, stderr } = await exec(ffmpegCommand);
      logger.debug('ffmpeg stdout:', { metadata: { data: stdout } });
      if (stderr) {
        logger.warn('ffmpeg stderr:', { metadata: { data: stderr } }); // Warn because ffmpeg can output info to stderr
      }
      logger.debug('ffmpeg mixing process completed.');
    } catch (ffmpegError: any) {
      logger.error('Error during ffmpeg execution:', { metadata: { error: ffmpegError instanceof Error ? ffmpegError.message : String(ffmpegError) } });
      logger.error('ffmpeg execution stdout:', { metadata: { data: ffmpegError.stdout } });
      logger.error('ffmpeg execution stderr:', { metadata: { data: ffmpegError.stderr } });
      
      // Instead of throwing, return the layer URL as fallback when ffmpeg fails
      logger.warn('[mixAudioFiles] ffmpeg execution failed, falling back to layer recording without mixing');
      return layerUrl;
    }

    // Check if outputPath was created and has content
    try {
      const stats = await fs.stat(finalOutputPath);
      if (stats.size === 0) {
        logger.error('ffmpeg output file is empty:', { metadata: { path: finalOutputPath } });
        logger.warn('[mixAudioFiles] ffmpeg output file is empty, falling back to layer recording without mixing');
        return layerUrl;
      }
      logger.debug(`ffmpeg output file created: ${finalOutputPath}, Size: ${stats.size} bytes`);
    } catch (statError) {
      logger.error('Error accessing ffmpeg output file stats:', { metadata: { path: finalOutputPath, error: statError instanceof Error ? statError.message : String(statError) } });
      logger.warn('[mixAudioFiles] ffmpeg output file not found, falling back to layer recording without mixing');
      return layerUrl;
    }

    // Read and upload mixed output
    logger.debug('Reading mixed audio file for upload...');
    const mixedBuf = await fs.readFile(finalOutputPath);
    const mimeType = 'audio/mp4'; // Always use MP4 for consistency
    const fileName = `mixed-${Date.now()}${outputExtension}`;
    const mixedFile = new File([mixedBuf], fileName, { type: mimeType });
    logger.debug(`Uploading mixed file: ${mixedFile.name}, Size: ${mixedFile.size} bytes, MIME: ${mimeType}`);
    const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
    const uploadUrl = await uploadFileToS3WithRetry(mixedFile, 'mixed');
    logger.debug(`Mixed file uploaded successfully to: ${uploadUrl}`);

    return uploadUrl;
  } finally {
    // Clean up temporary files and directory
    logger.debug(`Cleaning up temporary directory: ${tmpDir}`);
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => {
      logger.error(`Failed to clean up temporary directory ${tmpDir}:`, { metadata: { error: err instanceof Error ? err.message : String(err) } });
    });
  }
}
