'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { createTheme, State } from '@/app/lib/actions';
import { useActionState } from 'react';
import { saveAs } from 'file-saver';
import MetadataForm from './MetadataForm';
import RecordingControls from './RecordingControls';
import { logger } from '@/app/lib/logger';
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getAudioDuration } from '@/app/lib/audio-utils';
import confetti from 'canvas-confetti';

export default function CreateForm() {
  const router = useRouter();
  // Add success state for showing success message before redirect
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Use the server action directly with the form
  const initialState = { message: null, errors: {}, success: false };
  type ThemeFormState = {
    message: string | null;
    errors: any;
    success: boolean;
  };
  const [state, formAction, isPending] = useActionState(
    async (_state: ThemeFormState, formData: FormData): Promise<ThemeFormState> => {
      console.log('Form submission started');
      console.log('Duration from form data:', formData.get('duration'));
      
      const result = await createTheme(_state, formData);
      console.log('Create theme result:', result);
      
      // Ensure consistent return format
      return {
        message: result.message || null,
        errors: result.errors || {},
        success: result.success || false
      };
    },
    initialState
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [keySignature, setKeySignature] = useState('');  // Changed from 'key'
  const [scale, setScale] = useState('');
  const [chords, setChords] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [mediaURL, setMediaURL] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [instrument, setInstrument] = useState('');
  const [mode, setMode] = useState(''); // Add mode state
  const [duration, setDuration] = useState(0); // Add duration state
  const [trimStartTime, setTrimStartTime] = useState('');
  const [trimEndTime, setTrimEndTime] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null); // Change mediaRef to be compatible with both Audio and Video elements
  const metronomeRef = useRef<HTMLAudioElement | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

    // Handle success with confetti and redirect
  useEffect(() => {
    console.log('Success effect triggered, state:', state);
    if (state && state.success) {
      console.log('Success state detected, showing success message');
      // Show success message with confetti
      setShowSuccess(true);
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Redirect after showing success message for 2 seconds
      const redirectTimer = setTimeout(() => {
        console.log('Redirecting to themes page');
        router.push('/dashboard/themes');
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
    
    // Return undefined for other cases
    return undefined;
  }, [state, router]);

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      logger.error('MediaRecorder API is not supported in this browser.');
      return;
    }
  
    try {
      // Play the sample metronome sound and wait 4 seconds before recording
      const sampleAudio = new Audio("/samples/GLITCHHH.wav");
      sampleAudio.play();
      await new Promise((resolve) => setTimeout(resolve, 4000));
  
      const constraints = isVideoMode ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
      // Set up live visualization:
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(); // Corrected AudioContext instantiation
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      sourceNode.connect(analyser);
  
      // If you have a canvas for visualization
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const drawVisualization = () => {
          requestAnimationFrame(drawVisualization);
          analyser.getByteTimeDomainData(dataArray);
          if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "lime";
            canvasCtx.beginPath();
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
              const v = (dataArray[i] ?? 0) / 128.0;
              const y = (v * canvas.height) / 2;
              if (i === 0) {
                canvasCtx.moveTo(x, y);
              } else {
                canvasCtx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
          }
        };
        drawVisualization();
      }
  
      // Determine MIME type and create recorder
      const supportedType = getSupportedMimeType();
      const options = !isVideoMode && supportedType ? { mimeType: supportedType } : {};
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      mediaChunksRef.current = [];
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        if (mediaChunksRef.current.length === 0) {
          logger.warn('No media data recorded.');
          return;
        }
        const recorderMimeType =
          mediaRecorderRef.current?.mimeType ||
          (!isVideoMode && supportedType) ||
          (isVideoMode ? 'video/webm' : 'audio/webm');
        const blob = new Blob(mediaChunksRef.current, { type: recorderMimeType });
        const blobUrl = URL.createObjectURL(blob);
        logger.debug('Blob URL', { metadata: { data: blobUrl } });
        setMediaURL(blobUrl);
        let extension = "webm";
        if (recorderMimeType) {
          const mimeTypeParts = recorderMimeType.split("/");
          const typePart = mimeTypeParts[1];
          if (typePart) {
            extension = typePart.split(";")[0] ?? "webm";
          }
        }
        const recordedFile = new File([blob], `recording.${extension}`, { type: recorderMimeType });
        setFile(recordedFile);
        
        // Get duration for recorded audio
        if (!isVideoMode && recordedFile.type.startsWith('audio/')) {
          try {
            const recordedDuration = await getAudioDuration(recordedFile);
            console.log('Audio duration calculated:', recordedDuration);
            setDuration(recordedDuration);
            logger.debug('Recorded audio duration set to', { metadata: { duration: recordedDuration, unit: 'seconds' } });
          } catch (error) {
            console.error('Failed to get audio duration:', error);
            logger.error('Failed to get recorded audio duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
            setDuration(0);
          }
        } else {
          setDuration(0);
        }
        
        mediaChunksRef.current = [];
      };
  
      mediaRecorderRef.current.start();
      setIsRecording(true);
  
      // (Optional) Start your metronome interval if enabled:
      if (metronomeEnabled && metronomeRef.current) {
        const interval = 60000 / tempo;
        metronomeIntervalRef.current = window.setInterval(() => {
          if (metronomeRef.current) {
            metronomeRef.current.currentTime = 0;
            metronomeRef.current
              .play()
              .catch((error) => logger.error("Metronome playback failed", { metadata: { error: error instanceof Error ? error.message : String(error) } }));
          }
        }, interval);
      }
    } catch (error) {
      logger.error("Error accessing media devices", { metadata: { error: error instanceof Error ? error.message : String(error) } });
    }
  };

  const handleStopRecording = () => {
    logger.debug('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      if (metronomeRef.current) {
        metronomeRef.current.pause();
        metronomeRef.current.currentTime = 0;
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      logger.debug('Selected file URL', { metadata: { data: url } });
      setMediaURL(url);
      
      // Get audio duration if it's an audio file
      if (selectedFile.type.startsWith('audio/')) {
        try {
          const audioDuration = await getAudioDuration(selectedFile);
          console.log('Uploaded file duration calculated:', audioDuration);
          setDuration(audioDuration);
          logger.debug('Audio duration set to', { metadata: { duration: audioDuration, unit: 'seconds' } });
        } catch (error) {
          console.error('Failed to get uploaded file duration:', error);
          logger.error('Failed to get audio duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
          setDuration(0);
        }
      } else if (selectedFile.type.startsWith('video/')) {
        try {
          const { getVideoDuration } = await import('@/app/lib/video-utils');
          const videoDuration = await getVideoDuration(selectedFile);
          setDuration(videoDuration);
          logger.debug('Video duration set to', { metadata: { duration: videoDuration, unit: 'seconds' } });
        } catch (error) {
          logger.error('Failed to get video duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
          setDuration(0);
        }
      } else {
        setDuration(0);
      }
    } else {
      setDuration(0);
    }
  };

  const handlePlayMedia = () => {
    if (mediaRef.current) {
      mediaRef.current.play().catch((error) =>
        logger.error('Playback failed', { metadata: { error: error instanceof Error ? error.message : String(error) } })
      );
    }
  };

  const handleTrimAudio = async () => {
    if (!file || !mediaRef.current || isVideoMode) {
      logger.error('Cannot trim: No audio file, media element, or it is a video.');
      alert('Trimming is currently only supported for audio recordings.');
      return;
    }

    const startTime = parseFloat(trimStartTime);
    const endTime = parseFloat(trimEndTime);
    const duration = mediaRef.current.duration; // Ensure mediaRef.current is not null before accessing duration

    if (isNaN(startTime) || isNaN(endTime) || startTime < 0 || endTime <= startTime || endTime > duration) {
      alert(`Invalid trim times. Ensure 0 <= start < end <= ${duration.toFixed(2)} seconds.`);
      return;
    }

    try {
      // Ensure the media element's source is up to date
      if (mediaRef.current.src !== mediaURL) {
        mediaRef.current.src = mediaURL;
        await new Promise(resolve => {
          if (mediaRef.current) { // Check if mediaRef.current is not null
            mediaRef.current.onloadedmetadata = resolve;
          } else {
            resolve(null); // Resolve immediately if no mediaRef
          }
        });
      }
      
      mediaRef.current.currentTime = startTime;

      const mediaElementForStream = mediaRef.current as HTMLMediaElement & { captureStream: () => MediaStream }; // Correctly type mediaRef.current for captureStream
      const streamToRecord = mediaElementForStream.captureStream();
      const recorderOptions = { mimeType: file.type || getSupportedMimeType() || 'audio/webm' };
      const newMediaRecorder = new MediaRecorder(streamToRecord, recorderOptions);
      const chunks: Blob[] = [];

      newMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      newMediaRecorder.onstop = () => {
        const trimmedBlob = new Blob(chunks, { type: recorderOptions.mimeType });
        const trimmedUrl = URL.createObjectURL(trimmedBlob);
        const trimmedFile = new File([trimmedBlob], `trimmed_${file.name}`, { type: recorderOptions.mimeType });

        setMediaURL(trimmedUrl);
        setFile(trimmedFile);
        alert('Trimming successful!');
      };

      newMediaRecorder.start();
      mediaRef.current.play();

      setTimeout(() => {
        if (newMediaRecorder.state === 'recording') {
          newMediaRecorder.stop();
        }
        if (mediaRef.current && !mediaRef.current.paused) {
          mediaRef.current.pause();
        }
      }, (endTime - startTime) * 1000);

    } catch (error) {
      logger.error('Error during trimming', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      alert('An error occurred while trimming the audio.');
    }
  };

  // Submit file using the formAction via useRef to be included in the form data
  const fileInputRef = useRef<HTMLInputElement>(null);
  
    // Function to prepare and submit the form
  const handleFormSubmit = async (formData: FormData) => {
    console.log('=== handleFormSubmit called ===');
    console.log('File:', file);
    console.log('Duration:', duration);
    console.log('Title:', formData.get('title'));
    
    if (!file) {
      alert('Please record or upload an audio file before submitting.');
      return { message: 'Audio file required', errors: {}, success: false };
    }
    
    // Ensure the file is in the FormData
    if (fileInputRef.current && file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      console.log('File added to hidden input');
    }
    
    // Call the original form action
    console.log('=== Calling formAction ===');
    return await formAction(formData);
  };

  const isValidBlobUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'blob:';
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (mediaRef.current && mediaURL) {
      logger.debug('Loading media URL', { metadata: { data: mediaURL } });
      mediaRef.current.load();
    }
  }, [mediaURL]);

  // Use the formAction from useActionState which will handle the server redirect properly
  
  return (
    <form action={handleFormSubmit}>
      <div className="w-[500px] mx-auto">
        {/* Success Message with Confetti */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-green-800 to-green-600 text-white rounded-xl p-8 shadow-2xl border border-green-400 max-w-md mx-4 transform scale-100 animate-pulse">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-20 h-20 text-green-200 mx-auto animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-2">🎉 Theme Created!</h2>
                <p className="text-green-100 mb-4 text-lg">Your musical theme has been saved successfully and is ready for collaboration.</p>
                <p className="text-green-300 text-sm font-medium">Redirecting to themes page in 2 seconds...</p>
                <div className="mt-4 w-full bg-green-700 rounded-full h-2">
                  <div className="bg-green-300 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <MetadataForm 
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          genre={genre}
          onGenreChange={setGenre}
          keySignature={keySignature}
          onKeySignatureChange={setKeySignature}
          tempo={tempo}
          onTempoChange={setTempo}
          scale={scale}
          onScaleChange={setScale}
          chords={chords}
          onChordsChange={setChords}
          instrument={instrument}
          onInstrumentChange={setInstrument}
          mode={mode}
          onModeChange={setMode}
        />
        
        {/* Hidden form fields to ensure values are submitted with the form */}
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="genre" value={genre} />
        <input type="hidden" name="keySignature" value={keySignature} />
        <input type="hidden" name="tempo" value={tempo.toString()} />
        <input type="hidden" name="scale" value={scale} />
        <input type="hidden" name="chords" value={chords} />
        <input type="hidden" name="instrument" value={instrument} />
        <input type="hidden" name="mode" value={mode} />
        <RecordingControls 
          isRecording={isRecording}
          isVideoMode={isVideoMode}
          setIsVideoMode={setIsVideoMode}
          metronomeEnabled={metronomeEnabled}
          setMetronomeEnabled={setMetronomeEnabled}
          onStartStopRecording={isRecording ? handleStopRecording : handleStartRecording}
          onFileChange={handleFileChange}
          file={file}
        />
        
        {/* Hidden input to store the file for form submission */}
        <input 
          type="file" 
          name="audioFile" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          aria-hidden="true"
        />
        {/* Hidden input for duration */}
        <input 
          type="hidden" 
          name="duration" 
          value={duration} 
        />
        
        {/* Debug: Show current duration */}
        {duration > 0 && (
          <div className="mt-2 p-2 bg-blue-900 rounded text-blue-200 text-sm">
            Debug: Duration calculated: {duration} seconds ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})
          </div>
        )}
        
        {/* Debug: Show current duration */}
        {duration > 0 && (
          <div className="mt-2 p-2 bg-blue-900 rounded text-white text-sm">
            Debug: Current duration = {duration} seconds ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})
          </div>
        )}
        {/* Replace MediaPlayer component with inline audio/video element */}
        {mediaURL && isValidBlobUrl(mediaURL) && (
          <div className="mt-4">
            {isVideoMode ? (
              <video ref={mediaRef as React.Ref<HTMLVideoElement>} src={mediaURL} controls className="w-full rounded-lg" />
            ) : (
              <audio ref={mediaRef as React.Ref<HTMLAudioElement>} src={mediaURL} controls className="w-full" />
            )}
          </div>
        )}

        {/* UI for Trimming Audio */}
        {mediaURL && file && (
          <div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Trim Audio</h3>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <div className="flex-1">
                <label htmlFor="trimStartTime" className="block text-sm font-medium text-gray-300">
                  Start Time (s)
                </label>
                <input
                  type="number"
                  id="trimStartTime"
                  value={trimStartTime}
                  onChange={(e) => setTrimStartTime(e.target.value)}
                  placeholder="e.g., 0.5"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="trimEndTime" className="block text-sm font-medium text-gray-300">
                  End Time (s)
                </label>
                <input
                  type="number"
                  id="trimEndTime"
                  value={trimEndTime}
                  onChange={(e) => setTrimEndTime(e.target.value)}
                  placeholder="e.g., 5.0"
                  className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
              </div>
            </div>
            <Button
              onClick={handleTrimAudio}
              type="button"
              className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Trim Audio
            </Button>
             {mediaRef.current && <p className="mt-2 text-xs text-gray-400">Current duration: {mediaRef.current.duration ? mediaRef.current.duration.toFixed(2) : 'N/A'}s</p>}
          </div>
        )}
        
        <canvas ref={canvasRef} width={500} height={100} className="mt-4 border border-gray-600" />
        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/dashboard/themes"
            className="flex h-10 items-center rounded-lg bg-gray-700 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Cancel
          </Link>
          <Button 
            type="submit" 
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={isPending || showSuccess}
          >
            {isPending ? 'Creating...' : 'Create Theme'}
          </Button>
        </div>
        <div id="message" aria-live="polite" aria-atomic="true">
          {state && state.message && (
            <p className="mt-2 text-sm text-red-500" key={state.message}>
              {state.message}
            </p>
          )}
        </div>
        {metronomeEnabled && (
          <audio ref={metronomeRef} src="/samples/GLITCHHH.wav" preload="auto" />
        )}
      </div>
    </form>
  );
}