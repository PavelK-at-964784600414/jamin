// Simple Express server for audio mixing microservice
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());

app.post('/mix', async (req, res) => {
  const { originalUrl, layerUrl } = req.body;
  
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audiomix-'));
  
  try {
    // Download files
    const originalRes = await fetch(originalUrl);
    const layerRes = await fetch(layerUrl);
    
    const originalPath = path.join(tmpDir, 'original.webm');
    const layerPath = path.join(tmpDir, 'layer.webm');
    const outputPath = path.join(tmpDir, 'mixed.webm');
    
    await fs.writeFile(originalPath, Buffer.from(await originalRes.arrayBuffer()));
    await fs.writeFile(layerPath, Buffer.from(await layerRes.arrayBuffer()));
    
    // Mix with ffmpeg
    const command = `ffmpeg -y -i "${originalPath}" -i "${layerPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest" -c:a libopus "${outputPath}"`;
    
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout, stderr });
      });
    });
    
    // Return the mixed file
    const mixedBuffer = await fs.readFile(outputPath);
    res.setHeader('Content-Type', 'audio/webm');
    res.send(mixedBuffer);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(3001, () => {
  console.log('Audio mixing service running on port 3001');
});
