'use client';

import { useState, useRef, useEffect } from 'react';
import { CameraIcon, PhotoIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

// Guitar scale patterns (in semitones from root)
const SCALES = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Minor': [0, 2, 3, 5, 7, 8, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard guitar tuning (low to high)
const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

interface FretboardData {
  strings: number;
  frets: number;
  stringPositions: number[];
  fretPositions: number[];
  bounds: { x: number; y: number; width: number; height: number };
}

export default function FretboardDetector() {
  const [isOpenCVReady, setIsOpenCVReady] = useState(false);
  const [selectedScale, setSelectedScale] = useState('Major');
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [detectedFretboard, setDetectedFretboard] = useState<FretboardData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load OpenCV.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.onload = () => {
      // Wait for OpenCV to be ready
      const checkOpenCV = () => {
        if (typeof window !== 'undefined' && (window as any).cv && (window as any).cv.Mat) {
          setIsOpenCVReady(true);
        } else {
          setTimeout(checkOpenCV, 100);
        }
      };
      checkOpenCV();
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment' // Use back camera if available
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please try uploading an image instead.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setUseCamera(false);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      detectFretboard();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      detectFretboard();
    };
    img.src = URL.createObjectURL(file);
  };

  const detectFretboard = () => {
    if (!isOpenCVReady || !canvasRef.current) {
      alert('OpenCV is not ready yet. Please wait a moment and try again.');
      return;
    }
    
    setIsDetecting(true);
    
    try {
      const cv = (window as any).cv;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      
      // Get image data from canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const src = cv.matFromImageData(imageData);
      
      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply Gaussian blur to reduce noise
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      
      // Detect edges using Canny
      const edges = new cv.Mat();
      cv.Canny(blurred, edges, 50, 150);
      
      // Detect lines using HoughLinesP
      const lines = new cv.Mat();
      cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 50, 10);
      
      // Analyze detected lines to find fretboard structure
      const horizontalLines: number[] = [];
      const verticalLines: number[] = [];
      
      for (let i = 0; i < lines.rows; i++) {
        const x1 = lines.data32S[i * 4];
        const y1 = lines.data32S[i * 4 + 1];
        const x2 = lines.data32S[i * 4 + 2];
        const y2 = lines.data32S[i * 4 + 3];
        
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        
        // Classify lines as horizontal or vertical
        if (Math.abs(angle) < 15 || Math.abs(angle) > 165) {
          // Horizontal line (string)
          horizontalLines.push(y1);
        } else if (Math.abs(angle - 90) < 15 || Math.abs(angle + 90) < 15) {
          // Vertical line (fret)
          verticalLines.push(x1);
        }
      }
      
      // Clean up and sort the lines
      const uniqueHorizontal = [...new Set(horizontalLines.map(y => Math.round(y / 10) * 10))].sort((a, b) => a - b);
      const uniqueVertical = [...new Set(verticalLines.map(x => Math.round(x / 10) * 10))].sort((a, b) => a - b);
      
      // Filter lines that are too close to each other
      const filteredHorizontal = uniqueHorizontal.filter((y, i) => 
        i === 0 || y - uniqueHorizontal[i - 1] > 20
      );
      const filteredVertical = uniqueVertical.filter((x, i) => 
        i === 0 || x - uniqueVertical[i - 1] > 30
      );
      
      // Determine fretboard bounds
      const bounds = {
        x: Math.min(...filteredVertical),
        y: Math.min(...filteredHorizontal),
        width: Math.max(...filteredVertical) - Math.min(...filteredVertical),
        height: Math.max(...filteredHorizontal) - Math.min(...filteredHorizontal)
      };
      
      // Set detected fretboard data
      const fretboardData: FretboardData = {
        strings: Math.max(filteredHorizontal.length, 6), // Default to 6 strings
        frets: Math.max(filteredVertical.length - 1, 12), // Default to 12 frets
        stringPositions: filteredHorizontal,
        fretPositions: filteredVertical,
        bounds
      };
      
      setDetectedFretboard(fretboardData);
      
      // Clean up OpenCV matrices
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      lines.delete();
      
    } catch (error) {
      console.error('Error detecting fretboard:', error);
      alert('Error detecting fretboard. Please try a clearer image with better lighting.');
    } finally {
      setIsDetecting(false);
    }
  };

  const drawScale = () => {
    if (!detectedFretboard || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    
    // Get scale intervals
    const scaleIntervals = SCALES[selectedScale as keyof typeof SCALES];
    const rootIndex = NOTES.indexOf(selectedRoot);
    
    // Draw scale notes on each string
    STANDARD_TUNING.forEach((stringNote, stringIndex) => {
      if (stringIndex >= detectedFretboard.stringPositions.length) return;
      
      const stringY = detectedFretboard.stringPositions[stringIndex];
      const openStringIndex = NOTES.indexOf(stringNote);
      
      // Draw notes for each fret
      detectedFretboard.fretPositions.forEach((fretX, fretIndex) => {
        if (fretIndex >= detectedFretboard.frets) return;
        
        // Calculate the note at this fret
        const noteIndex = (openStringIndex + fretIndex) % 12;
        const intervalFromRoot = (noteIndex - rootIndex + 12) % 12;
        
        // Check if this note is in the selected scale
        if (scaleIntervals.includes(intervalFromRoot)) {
          const isRoot = intervalFromRoot === 0;
          
          // Draw the note circle
          ctx.beginPath();
          ctx.arc(fretX, stringY, isRoot ? 12 : 8, 0, 2 * Math.PI);
          ctx.fillStyle = isRoot ? '#ef4444' : '#3b82f6'; // Red for root, blue for other scale notes
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw note name
          ctx.fillStyle = '#ffffff';
          ctx.font = isRoot ? 'bold 10px Arial' : '8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(NOTES[noteIndex], fretX, stringY);
        }
      });
    });
  };

  useEffect(() => {
    if (detectedFretboard) {
      drawScale();
    }
  }, [selectedScale, selectedRoot, detectedFretboard]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MusicalNoteIcon className="w-5 h-5 mr-2" />
          Guitar Fretboard Scale Detector
        </h3>
        
        {!isOpenCVReady && (
          <div className="bg-yellow-800 border border-yellow-600 rounded-lg p-4 mb-4">
            <p className="text-yellow-200">Loading OpenCV.js... Please wait.</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Root Note
              </label>
              <select
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Scale
              </label>
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(SCALES).map(scale => (
                  <option key={scale} value={scale}>{scale}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Image Source</h4>
              
              <div className="flex space-x-2">
                <button
                  onClick={useCamera ? stopCamera : startCamera}
                  disabled={!isOpenCVReady}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  {useCamera ? 'Stop Camera' : 'Use Camera'}
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isOpenCVReady}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <PhotoIcon className="w-4 h-4 mr-2" />
                  Upload Image
                </button>
              </div>

              {useCamera && (
                <button
                  onClick={captureFromCamera}
                  disabled={isDetecting}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {isDetecting ? 'Detecting...' : 'Capture & Detect'}
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {detectedFretboard && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Detection Results</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Strings detected: {detectedFretboard.strings}</p>
                  <p>Frets detected: {detectedFretboard.frets}</p>
                  <p>Scale: {selectedRoot} {selectedScale}</p>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  <p>Red circles = Root note</p>
                  <p>Blue circles = Scale notes</p>
                </div>
              </div>
            )}
          </div>

          {/* Display Area */}
          <div className="space-y-4">
            {useCamera && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            )}
            
            <canvas
              ref={canvasRef}
              className="w-full border border-gray-600 rounded-lg bg-black"
              style={{ maxHeight: '400px' }}
            />
            
            {!detectedFretboard && !useCamera && (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-600 rounded-lg">
                <div className="text-center text-gray-400">
                  <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Upload an image or use camera to detect fretboard</p>
                  <p className="text-sm mt-1">Make sure the guitar fretboard is clearly visible</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
