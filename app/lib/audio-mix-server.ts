import mainPath from 'path'; // aliased to mainPath to avoid conflict with the path module imported later
import fsPromises from 'fs/promises'; // Import fs.promises directly
// Server-only audio mixing utilities for Next.js (Node.js only)

const nodeEnv = process.env.NODE_ENV;

function getFfmpegBinaryName(): string {
  const platform = process.platform;
  if (platform === 'darwin') return 'ffmpeg'; // macOS
  if (platform === 'win32') return 'ffmpeg.exe'; // Windows
  return 'ffmpeg'; // Linux and other Unix-like
}

let ffmpegExecutablePath: string;

console.log(`[audio-mix-server] Initializing: NODE_ENV = "${nodeEnv}"`);

try {
  // require('ffmpeg-static') returns the path to the ffmpeg binary
  const resolvedPath = require('ffmpeg-static');
  if (!resolvedPath || typeof resolvedPath !== 'string') {
    throw new Error("ffmpeg-static returned invalid path");
  }
  ffmpegExecutablePath = resolvedPath;
  console.log(`[audio-mix-server] Using ffmpeg-static path: ${ffmpegExecutablePath}`);
} catch (error) {
  console.error("[audio-mix-server] CRITICAL: Failed to resolve ffmpeg-static path:", error);
  
  // Fallback paths for different environments
  const possiblePaths = [
    // PNPM path (most likely for this project)
    mainPath.join(process.cwd(), 'node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg'),
    // Standard npm path
    mainPath.join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
    // Alternative PNPM path
    mainPath.join(process.cwd(), 'node_modules/.ignored/ffmpeg-static/ffmpeg'),
    // System paths
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg'
  ];
  
  // Try to find an existing path
  let foundPath = null;
  for (const testPath of possiblePaths) {
    try {
      require('fs').accessSync(testPath, require('fs').constants.F_OK);
      foundPath = testPath;
      console.log(`[audio-mix-server] Found working ffmpeg at: ${foundPath}`);
      break;
    } catch (accessError) {
      console.log(`[audio-mix-server] Path not accessible: ${testPath}`);
    }
  }
  
  ffmpegExecutablePath = foundPath || possiblePaths[0]!;
  console.log(`[audio-mix-server] Using fallback path: ${ffmpegExecutablePath}`);
}

console.log(`[audio-mix-server] Final ffmpeg executable path: ${ffmpegExecutablePath}`);

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
  try {
    await fsPromises.stat(ffmpegExecutablePath);
    console.log(`[mixAudioFiles] Verified: ffmpeg executable exists at: ${ffmpegExecutablePath}`);
  } catch (statError) {
    console.error(`[mixAudioFiles] CRITICAL ERROR: Initial ffmpeg path failed: ${ffmpegExecutablePath}`, statError);
    
    // Try fallback paths if primary path fails
    const fallbackPaths = [
      mainPath.join(process.cwd(), 'node_modules/.pnpm/ffmpeg-static@5.2.0/node_modules/ffmpeg-static/ffmpeg'),
      mainPath.join(process.cwd(), 'node_modules/.ignored/ffmpeg-static/ffmpeg'),
      mainPath.join(process.cwd(), 'node_modules/ffmpeg-static/ffmpeg'),
    ];
    
    let foundWorkingPath = null;
    for (const fallbackPath of fallbackPaths) {
      try {
        await fsPromises.stat(fallbackPath);
        foundWorkingPath = fallbackPath;
        console.log(`[mixAudioFiles] Found working fallback path: ${fallbackPath}`);
        break;
      } catch (fallbackError) {
        console.log(`[mixAudioFiles] Fallback path failed: ${fallbackPath}`);
      }
    }
    
    if (foundWorkingPath) {
      ffmpegExecutablePath = foundWorkingPath;
      console.log(`[mixAudioFiles] Updated ffmpeg path to: ${ffmpegExecutablePath}`);
    } else {
      throw new Error(`ffmpeg not found at ${ffmpegExecutablePath} or any fallback paths. Stat error: ${statError instanceof Error ? statError.message : String(statError)}`);
    }
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jamimix-'));
  const originalPath = path.join(tmpDir, 'original.webm');
  const layerPath = path.join(tmpDir, 'layer.webm');
  const outputPath = path.join(tmpDir, 'mixed.webm');

  console.log(`Temporary directory created: ${tmpDir}`);
  console.log(`Original audio will be saved to: ${originalPath}`);
  console.log(`Layer audio will be saved to: ${layerPath}`);
  console.log(`Mixed output will be saved to: ${outputPath}`);

  try {
    // Download and write original audio
    console.log(`Downloading original audio from: ${originalUrl}`);
    const origRes = await fetch(originalUrl);
    if (!origRes.ok) throw new Error(`Failed to download original audio: ${origRes.status} ${origRes.statusText}`);
    const origBuf = await origRes.arrayBuffer();
    await fs.writeFile(originalPath, new Uint8Array(Buffer.from(origBuf)));
    console.log(`Original audio downloaded and saved successfully. Size: ${origBuf.byteLength} bytes`);

    // Download and write layer audio
    console.log(`Downloading layer audio from: ${layerUrl}`);
    const layerRes = await fetch(layerUrl);
    if (!layerRes.ok) throw new Error(`Failed to download layer audio: ${layerRes.status} ${layerRes.statusText}`);
    const layerBuf = await layerRes.arrayBuffer();
    await fs.writeFile(layerPath, new Uint8Array(Buffer.from(layerBuf)));
    console.log(`Layer audio downloaded and saved successfully. Size: ${layerBuf.byteLength} bytes`);

    // Construct and execute ffmpeg command using the resolved ffmpegExecutablePath
    const ffmpegCommand = `${ffmpegExecutablePath} -y -i "${originalPath}" -i "${layerPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" -c:a libopus "${outputPath}"`;
    console.log(`Executing ffmpeg command: ${ffmpegCommand}`);
    
    try {
      const { stdout, stderr } = await exec(ffmpegCommand);
      console.log('ffmpeg stdout:', stdout);
      if (stderr) {
        console.warn('ffmpeg stderr:', stderr); // Warn because ffmpeg can output info to stderr
      }
      console.log('ffmpeg mixing process completed.');
    } catch (ffmpegError: any) {
      console.error('Error during ffmpeg execution:', ffmpegError);
      console.error('ffmpeg execution stdout:', ffmpegError.stdout);
      console.error('ffmpeg execution stderr:', ffmpegError.stderr);
      throw new Error(`ffmpeg execution failed: ${ffmpegError.message}`);
    }

    // Check if outputPath was created and has content
    try {
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        console.error('ffmpeg output file is empty:', outputPath);
        throw new Error('ffmpeg output file is empty after mixing.');
      }
      console.log(`ffmpeg output file created: ${outputPath}, Size: ${stats.size} bytes`);
    } catch (statError) {
      console.error('Error accessing ffmpeg output file stats:', outputPath, statError);
      const errorMessage = statError instanceof Error ? statError.message : String(statError);
      throw new Error(`Failed to access or verify ffmpeg output file: ${errorMessage}`);
    }

    // Read and upload mixed output
    console.log('Reading mixed audio file for upload...');
    const mixedBuf = await fs.readFile(outputPath);
    const mixedFile = new File([mixedBuf], `mixed-${Date.now()}.webm`, { type: 'audio/webm' });
    console.log(`Uploading mixed file: ${mixedFile.name}, Size: ${mixedFile.size} bytes`);
    const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
    const uploadUrl = await uploadFileToS3WithRetry(mixedFile, 'mixed');
    console.log(`Mixed file uploaded successfully to: ${uploadUrl}`);

    return uploadUrl;
  } finally {
    // Clean up temporary files and directory
    console.log(`Cleaning up temporary directory: ${tmpDir}`);
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => {
      console.error(`Failed to clean up temporary directory ${tmpDir}:`, err);
    });
  }
}
