// Client-side audio mixing using Web Audio API
// This runs in the browser and works on all platforms including Vercel

export class ClientAudioMixer {
  private audioContext: AudioContext;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async mixAudioFiles(originalUrl: string, layerUrl: string): Promise<Blob> {
    try {
      // Download and decode both audio files
      const [originalBuffer, layerBuffer] = await Promise.all([
        this.loadAudioBuffer(originalUrl),
        this.loadAudioBuffer(layerUrl)
      ]);

      // Create output buffer with the longer duration
      const outputLength = Math.max(originalBuffer.length, layerBuffer.length);
      const outputBuffer = this.audioContext.createBuffer(
        2, // stereo
        outputLength,
        originalBuffer.sampleRate
      );

      // Mix the audio channels
      for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        const outputData = outputBuffer.getChannelData(channel);
        const originalData = originalBuffer.getChannelData(Math.min(channel, originalBuffer.numberOfChannels - 1));
        const layerData = layerBuffer.getChannelData(Math.min(channel, layerBuffer.numberOfChannels - 1));

        for (let i = 0; i < outputLength; i++) {
          const originalSample = i < originalBuffer.length ? originalData[i] : 0;
          const layerSample = i < layerBuffer.length ? layerData[i] : 0;
          // Simple mixing: average the two signals
          outputData[i] = ((originalSample || 0) + (layerSample || 0)) * 0.5;
        }
      }

      // Convert to blob
      return this.audioBufferToBlob(outputBuffer);
    } catch (error) {
      console.error('Client-side audio mixing failed:', error);
      throw error;
    }
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private audioBufferToBlob(buffer: AudioBuffer): Blob {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    
    // Create WAV file
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        const rawSample = channelData[i];
        const sample = Math.max(-1, Math.min(1, rawSample || 0));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }
}
