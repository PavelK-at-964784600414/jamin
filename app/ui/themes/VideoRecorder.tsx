'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/ui/button';
import { 
  PlayIcon, 
  StopIcon, 
  VideoCameraIcon,
  MicrophoneIcon 
} from '@heroicons/react/24/outline';
import { getSupportedVideoFormats, getVideoDuration, isVideoFile } from '@/app/lib/video-utils';

interface VideoRecorderProps {
  onRecordingComplete: (file: File, duration: number) => void;
  onError: (error: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export default function VideoRecorder({
  onRecordingComplete,
  onError,
  isRecording,
  setIsRecording
}: VideoRecorderProps) {
  const [mediaURL, setMediaURL] = useState('');
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check supported formats on mount
    const formats = getSupportedVideoFormats();
    setSupportedFormats(formats);
    
    if (!formats.supported) {
      onError('Video recording is not supported in this browser');
    }
  }, [onError]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Test permissions and then stop the stream
      stream.getTracks().forEach(track => track.stop());
      setHasPermissions(true);
      return true;
    } catch (error) {
      console.error('Permission denied:', error);
      onError('Camera and microphone permissions are required for video recording');
      return false;
    }
  };

  const startRecording = async () => {
    if (!supportedFormats?.supported) {
      onError('Video recording is not supported in this browser');
      return;
    }

    try {
      // Request permissions if not already granted
      if (!hasPermissions) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Show live preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Create MediaRecorder with the best supported format
      const options = { mimeType: supportedFormats.preferred };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mediaChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, { 
          type: supportedFormats.preferred 
        });
        
        const extension = supportedFormats.preferred.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `video-recording.${extension}`, { 
          type: supportedFormats.preferred 
        });

        const url = URL.createObjectURL(blob);
        setMediaURL(url);
        setRecordedFile(file);

        // Get video duration
        try {
          const duration = await getVideoDuration(file);
          onRecordingComplete(file, duration);
        } catch (error) {
          console.error('Failed to get video duration:', error);
          onRecordingComplete(file, 0);
        }

        // Stop live preview
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError('An error occurred during recording');
      };

      // Start recording with time slice to collect data chunks during recording
      // This prevents issues with long recordings and ensures data is available
      mediaRecorderRef.current.start(1000); // 1 second time slice
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting video recording:', error);
      onError('Failed to start video recording. Please check your camera and microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setMediaURL('');
    setRecordedFile(null);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
    // Revoke URL to free memory
    if (mediaURL) {
      URL.revokeObjectURL(mediaURL);
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex gap-2">
        {!isRecording && !recordedFile && (
          <Button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            disabled={!supportedFormats?.supported}
          >
            <VideoCameraIcon className="h-4 w-4" />
            Start Video Recording
          </Button>
        )}
        
        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
          >
            <StopIcon className="h-4 w-4" />
            Stop Recording
          </Button>
        )}

        {recordedFile && (
          <Button
            type="button"
            onClick={clearRecording}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white border border-gray-500"
          >
            Clear Recording
          </Button>
        )}
      </div>

      {/* Video Preview/Playback */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls={!isRecording && !!mediaURL}
          muted={isRecording}
          src={!isRecording ? mediaURL : undefined}
        />
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}

        {/* Placeholder when no video */}
        {!isRecording && !mediaURL && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <VideoCameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Video preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Format Support Info */}
      {supportedFormats && !supportedFormats.supported && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            Video recording is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      )}

      {/* Recording Info */}
      {recordedFile && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Video recorded successfully! File size: {(recordedFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
}