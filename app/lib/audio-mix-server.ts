// Server-only audio mixing utilities for Next.js (Node.js only)

import ffmpegPath from 'ffmpeg-static';

/**
 * Mix two audio files by downloading them, combining using ffmpeg, and uploading the result to S3.
 * @param originalUrl URL of the original theme audio
 * @param layerUrl URL of the new layer audio
 * @returns URL of the mixed audio file
 */
export async function mixAudioFiles(originalUrl: string, layerUrl: string): Promise<string> {
  const os = await import('os');
  const path = await import('path');
  const fs = await import('fs').then(mod => mod.promises);
  const { promisify } = await import('util');
  const exec = promisify((await import('child_process')).exec);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jamimix-'));
  const originalPath = path.join(tmpDir, 'original.webm');
  const layerPath = path.join(tmpDir, 'layer.webm');
  const outputPath = path.join(tmpDir, 'mixed.webm');

  // Download and write original audio
  const origRes = await fetch(originalUrl);
  if (!origRes.ok) throw new Error(`Failed to download original audio: ${origRes.statusText}`);
  const origBuf = await origRes.arrayBuffer();
  await fs.writeFile(originalPath, new Uint8Array(Buffer.from(origBuf)));

  // Download and write layer audio
  const layerRes = await fetch(layerUrl);
  if (!layerRes.ok) throw new Error(`Failed to download layer audio: ${layerRes.statusText}`);
  const layerBuf = await layerRes.arrayBuffer();
  await fs.writeFile(layerPath, new Uint8Array(Buffer.from(layerBuf)));

  // Mix using ffmpeg (requires ffmpeg in PATH)
  await exec(
    `${ffmpegPath} -y -i "${originalPath}" -i "${layerPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" -c:a libopus "${outputPath}"`
  );

  // Read and upload mixed output
  const mixedBuf = await fs.readFile(outputPath);
  const mixedFile = new File([mixedBuf], `mixed-${Date.now()}.webm`, { type: 'audio/webm' });
  const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
  const uploadUrl = await uploadFileToS3WithRetry(mixedFile, 'mixed');

  return uploadUrl;
}
