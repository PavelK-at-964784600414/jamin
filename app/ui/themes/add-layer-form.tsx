'use client';

import { useState, useRef, useEffect, useActionState } from 'react'; // Changed import
import { ThemesTable } from '@/app/lib/definitions';
import { createLayer, LayerState } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import RecordingControls from './RecordingControls';
import MediaPlayer from './MediaPlayer';
import LayerMetadataForm from './LayerMetadataForm';
import ClientAudioMixer from '@/app/components/ClientAudioMixer';
import { getSupportedAudioFormats, validateAudioFile, getAudioDuration } from '@/app/lib/audio-utils';
import { logger } from '@/app/lib/logger';
import confetti from 'canvas-confetti';

interface AddLayerFormProps {
  theme: ThemesTable;
}

export default function AddLayerForm({ theme }: AddLayerFormProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Initialize the form state for server action response with proper typing
  const initialState: LayerState = { 
    message: null, 
    errors: {},
    success: false,
    themeId: undefined 
  };
  
  // Use useActionState with explicit typing
  const [state, formAction, isPending] = useActionState<LayerState, FormData>( // Changed to useActionState and added isPending
    createLayer, // Pass the server action directly
    initialState
  );
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [mixedFile, setMixedFile] = useState<File | null>(null); // For client-side mixed audio
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio mixing state
  const [showMixer, setShowMixer] = useState(false);
  const [mixingProgress, setMixingProgress] = useState(0);
  const [mixingError, setMixingError] = useState<string | null>(null);
  
  // Theme playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);
  const themeAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Form state
  const [title, setTitle] = useState(`${theme.title} - Layer`);
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState(theme.description.split(',')[0] || '');
  const [keySignature, setKeySignature] = useState(theme.key);
  const [tempo, setTempo] = useState(theme.tempo);
  const [scale, setScale] = useState('');
  const [chords, setChords] = useState(theme.chords || '');
  const [instrument, setInstrument] = useState('Piano'); // Set a default instrument
  const [mode, setMode] = useState(theme.mode);
  const [duration, setDuration] = useState(0); // Add duration state

  // Form submission state - isSubmitting can potentially be replaced by isPending from useActionState
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // Added success state

  // Initialize theme audio element
  useEffect(() => {
    const audio = new Audio();
    audio.src = theme.recording_url;
    audio.preload = 'auto';
    themeAudioRef.current = audio;
    
    return () => {
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
      }
    };
  }, [theme.recording_url]);

  // Start/stop recording
  const handleStartStopRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop theme playback
      if (themeAudioRef.current) {
        themeAudioRef.current.pause();
        themeAudioRef.current.currentTime = 0;
      }
      
      setIsPlaying(false);
      setIsRecording(false);
      
      // Stop and clean up media stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    } else {
      try {
        // Request media permissions
        const constraints = isVideoMode 
          ? { audio: true, video: true }
          : { audio: true };
          
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setMediaStream(stream);
        
        // Create media recorder with explicit MIME type to ensure compatibility
        const formats = getSupportedAudioFormats();
        const mimeType = isVideoMode 
          ? formats.video.preferredFormat 
          : formats.audio.preferredFormat;
        
        logger.debug(`Using media recorder with MIME type: ${mimeType}`);
        
        // Create media recorder with the best supported MIME type
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: mimeType,
          audioBitsPerSecond: 128000 // 128 kbps for good audio quality
        });
        mediaRecorderRef.current = mediaRecorder;
        
        // Set up data handlers
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          // Get the proper MIME type from the recorder
          const mimeType = mediaRecorder.mimeType || (isVideoMode ? 'video/webm' : 'audio/webm');
          logger.debug(`Recording completed with MIME type: ${mimeType}`);
          
          // Create blob with explicit MIME type
          const recordedBlob = new Blob(chunks, { type: mimeType });
          
          // Create filename with appropriate extension based on MIME type
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';
          else if (mimeType.includes('mp3')) extension = 'mp3';
          else if (mimeType.includes('wav')) extension = 'wav';
          
          const fileName = `layer-${Date.now()}.${extension}`;
          
          // Create File with explicit MIME type
          const recordedFile = new File([recordedBlob], fileName, { 
            type: mimeType,
            lastModified: Date.now()
          });
          
          logger.debug(`Created recording file: ${fileName}, size: ${recordedBlob.size} bytes, type: ${mimeType}`);
          
          setFile(recordedFile);
          
          // Get duration for recorded audio/video
          if (!isVideoMode && recordedFile.type.startsWith('audio/')) {
            try {
              const recordedDuration = await getAudioDuration(recordedFile);
              setDuration(recordedDuration);
              logger.debug('Recorded layer duration set to', { metadata: { duration: recordedDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get recorded layer duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else if (isVideoMode && recordedFile.type.startsWith('video/')) {
            try {
              const { getVideoDuration } = await import('@/app/lib/video-utils');
              const videoDuration = await getVideoDuration(recordedFile);
              setDuration(videoDuration);
              logger.debug('Recorded video duration set to', { metadata: { duration: videoDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get recorded video duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else {
            setDuration(0);
          }
          
          setRecordedChunks(chunks);
        };
        
        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        
        // Start theme playback
        if (themeAudioRef.current) {
          themeAudioRef.current.currentTime = 0;
          themeAudioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(error => {
              logger.error("Error playing theme audio", { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setError("Failed to play the original theme. Please try again.");
            });
        }
      } catch (err) {
        logger.error('Error accessing media devices', { metadata: { data: err } });
        setError('Failed to access your microphone or camera. Please check permissions.');
      }
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate the media file
      try {
        // Check if the file is a valid media file (use appropriate validation)
        let isValid = false;
        if (selectedFile.type.startsWith('video/')) {
          const { validateVideoFile } = await import('@/app/lib/video-utils');
          isValid = await validateVideoFile(selectedFile);
        } else {
          isValid = await validateAudioFile(selectedFile);
        }
        
        if (isValid) {
          logger.debug('File validated successfully', { metadata: { data: selectedFile.name } });
          setFile(selectedFile);
          setError(null);
          
          // Get audio/video duration if it's a media file
          if (selectedFile.type.startsWith('audio/')) {
            try {
              const audioDuration = await getAudioDuration(selectedFile);
              setDuration(audioDuration);
              logger.debug('Layer audio duration set to', { metadata: { duration: audioDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get layer audio duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else if (selectedFile.type.startsWith('video/')) {
            try {
              const { getVideoDuration } = await import('@/app/lib/video-utils');
              const videoDuration = await getVideoDuration(selectedFile);
              setDuration(videoDuration);
              logger.debug('Layer video duration set to', { metadata: { duration: videoDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get layer video duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else {
            setDuration(0);
          }
        } else {
          logger.error('Invalid audio file', { metadata: { data: selectedFile.name } });
          setError('The selected file appears to be invalid or corrupted. Please try another file.');
          e.target.value = ''; // Reset the input
        }
      } catch (validationError) {
        logger.error('Error validating file', { metadata: { error: validationError instanceof Error ? validationError.message : String(validationError) } });
        setFile(selectedFile); // Still set the file, we'll try to handle it
      }
    }
  };

  // Toggle theme playback preview
  const toggleThemePlayback = () => {
    setIsPlaybackModalOpen(!isPlaybackModalOpen);
  };

  // Handle audio mixing completion
  const handleMixComplete = async (mixedAudioBlob: Blob) => {
    try {
      logger.debug('[AddLayerForm] Processing mixed audio blob');
      
      const mixedFileName = `mixed-${Date.now()}.mp4`;
      const mixedAudioFile = new File([mixedAudioBlob], mixedFileName, { 
        type: 'audio/mp4',
        lastModified: Date.now()
      });
      
      setMixedFile(mixedAudioFile);
      setShowMixer(false);
      setMixingError(null);
      
      // Get duration of mixed audio
      try {
        const mixedDuration = await getAudioDuration(mixedAudioFile);
        setDuration(mixedDuration);
        logger.debug('Mixed audio duration set', { metadata: { duration: mixedDuration, unit: 'seconds' } });
      } catch (error) {
        logger.error('Failed to get mixed audio duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        setDuration(0);
      }
      
      logger.debug('[AddLayerForm] Audio mixing completed successfully');
    } catch (error) {
      logger.error('[AddLayerForm] Error processing mixed audio:', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      setMixingError('Failed to process mixed audio. Please try again.');
    }
  };

  // Handle audio mixing error
  const handleMixError = (errorMessage: string) => {
    setMixingError(errorMessage);
    setShowMixer(false);
    logger.error('[AddLayerForm] Audio mixing failed:', { metadata: { error: errorMessage } });
  };

  // Handle mixing progress
  const handleMixProgress = (progress: number) => {
    setMixingProgress(progress);
  };

  // Start audio mixing process
  const startAudioMixing = () => {
    if (!file) {
      setError('No layer audio file available for mixing.');
      return;
    }
    
    setMixingError(null);
    setMixingProgress(0);
    setShowMixer(true);
    logger.debug('[AddLayerForm] Starting audio mixing process');
  };

  // Maximum file size: 500MB (increased for video files)
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  const ALLOWED_AUDIO_TYPES = [
    'audio/webm',
    'audio/mp3',
    'audio/mp4',
    'video/mp4',
    'audio/wav',
    'audio/mpeg',
    'video/webm', // For video recordings
  ];

  // Function to prepare form submission - validates inputs and prepares file
  const prepareFormSubmission = async () => {
    setError(null);
    setSuccess(null); // Reset success message on new submission attempt
    
    // Check if we have a mixed file (preferred) or raw file
    const fileToCheck = mixedFile || file;
    
    // File validation
    if (!fileToCheck) {
      setError('No file to save. Please record or upload a file first.');
      return false;
    }
    
    // File size validation
    if (fileToCheck.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return false;
    }
    
    // File type validation
    if (!ALLOWED_AUDIO_TYPES.includes(fileToCheck.type)) {
      // If file type is not in allowed list, check if it's a known audio type
      const isAudioFile = fileToCheck.type.startsWith('audio/') || fileToCheck.type.startsWith('video/');
      if (!isAudioFile) {
        setError('Invalid file type. Please upload a supported audio format.');
        return false;
      }
      // If it's an audio type but not in our allowed list, we'll still try to process it
      logger.warn(`File type ${fileToCheck.type} not in allowed list, but appears to be audio/video`);
    }
    
    // Validate that the media file is playable (use appropriate validation for file type)
    try {
      let isValid = false;
      if (fileToCheck.type.startsWith('video/')) {
        const { validateVideoFile } = await import('@/app/lib/video-utils');
        isValid = await validateVideoFile(fileToCheck);
      } else {
        isValid = await validateAudioFile(fileToCheck);
      }
      
      if (!isValid) {
        logger.warn('Media validation detected potential issues with the file');
        // We'll still continue, but log the warning
      }
    } catch (error) {
      logger.error('Error validating media file', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      // Continue despite validation error
    }
    
    // Title validation
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    // No longer using DataTransfer API which causes Safari issues
    if (!fileToCheck) {
      setError('No audio file selected. Please record or upload a file.');
      return false;
    }
    
    return true;
  };
  
  // Form validation and submission is now handled inline in the form action

  // Function for form validation - Safari-friendly
  const validateFormData = async () => {
    return await prepareFormSubmission();
  };

  useEffect(() => {
    // After form submission via formAction, handle success or errors
    if (state?.message) {
      setError(state.message);
      setSuccess(null); // Clear success message if there's an error
    } else if (state?.success) {
      // If the submission was successful
      setShowSuccess(true);
      setSuccess('Layer created and saved successfully!');
      setFile(null);
      setRecordedChunks([]);
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Add a small delay before redirecting so user can see the success message
      const redirectTimer = setTimeout(() => {
        if (state.themeId) {
          router.push(`/dashboard/themes/${state.themeId}`);
        }
      }, 2000); // Increased to 2 seconds to give more time to see the enhanced message
      
      // Clean up the timer if the component unmounts
      return () => clearTimeout(redirectTimer);
    } else {
      // If there's no message and no success, clear both (e.g., initial state or after a non-error/non-success update)
      setError(null);
      setSuccess(null);
    }
    
    // Return undefined for other code paths
    return undefined;
  }, [state, router]);

  // Handle form submission - server action wrapper
  const handleFormSubmit = async (formData: FormData) => {
    console.log('=== handleFormSubmit called for add-layer ===');
    
    // First validate the form data
    const fileToCheck = mixedFile || file;
    
    if (!fileToCheck) {
      alert('No file to save. Please record or upload a file first.');
      return { message: 'Audio file required', errors: {}, success: false, themeId: theme.id };
    }
    
    // Title validation
    if (!title.trim()) {
      alert('Title is required');
      return { message: 'Title required', errors: {}, success: false, themeId: theme.id };
    }

    try {
      // Handle file upload in a Safari-compatible way
      const finalFile = mixedFile || file;
      if (finalFile) {
        try {
          // Use FileReader approach for Safari compatibility
          const safeFile = await new Promise<File>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                  throw new Error('FileReader did not produce a result');
                }
                
                // Determine a safe MIME type
                let safeMimeType = finalFile.type || 'audio/webm';
                if (!safeMimeType || safeMimeType === '') {
                  if (finalFile.name.endsWith('.mp3')) safeMimeType = 'audio/mpeg';
                  else if (finalFile.name.endsWith('.wav')) safeMimeType = 'audio/wav';
                  else if (finalFile.name.endsWith('.webm')) safeMimeType = 'audio/webm';
                  else if (finalFile.name.endsWith('.mp4')) safeMimeType = 'audio/mp4';
                  else safeMimeType = 'audio/webm';
                }
                
                const fileBlob = new Blob([arrayBuffer], { type: safeMimeType });
                const fileName = finalFile.name || `recording-${Date.now()}.webm`;
                const newFile = new File([fileBlob], fileName, { 
                  type: safeMimeType,
                  lastModified: Date.now()
                });
                
                resolve(newFile);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = () => reject(new Error('FileReader failed'));
            reader.readAsArrayBuffer(finalFile);
          });
          
          // Add the safe file to the FormData (replace any existing audioFile)
          formData.set('audioFile', safeFile);
          logger.debug('Using FileReader approach for Safari compatibility');
        } catch (error) {
          logger.error('Error with FileReader approach', { metadata: { error: error instanceof Error ? error.message : String(error) } });
          // Fallback
          try {
            const blobType = finalFile.type || 'audio/webm';
            const fileName = finalFile.name || `recording-${Date.now()}.webm`;
            const fileBlob = finalFile.slice(0, finalFile.size, blobType);
            const safeFile = new File([fileBlob], fileName, { 
              type: blobType,
              lastModified: Date.now()
            });
            formData.set('audioFile', safeFile);
            logger.debug('Using slice fallback for Safari compatibility');
          } catch (fallbackError) {
            logger.error('All safe approaches failed', { metadata: { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) } });
            formData.set('audioFile', finalFile);
            logger.debug('Using direct file append as last resort');
          }
        }
      }
      
      console.log('=== Calling formAction for add-layer ===');
      return await formAction(formData);
      
    } catch (e) {
      logger.error('Error saving layer', { metadata: { data: e } });
      return {
        message: 'Failed to save layer. Please try again.',
        success: false,
        errors: {},
        themeId: theme.id
      };
    }
  };

  return (
    <>
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
              <h2 className="text-3xl font-bold mb-2">🎉 Layer Added!</h2>
              <p className="text-green-100 mb-4 text-lg">Your layer has been saved successfully and added to the theme.</p>
              <p className="text-green-300 text-sm font-medium">Redirecting to theme page in 2 seconds...</p>
              <div className="mt-4 w-full bg-green-700 rounded-full h-2">
                <div className="bg-green-300 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form action={handleFormSubmit}>
        <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Add a New Layer</h2>
            <p className="text-gray-300">
              Record or upload your layer while listening to the original theme. 
              The original theme will play during recording for synchronization.
            </p>
          </div>

          {/* Success message - prominent position at top */}
          {success && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-800 to-green-600 text-white rounded-lg border border-green-500 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">✨ {success}</h3>
                  <p className="text-green-200 text-sm mt-1">Redirecting to your theme...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 text-white rounded-md">
              {error}
            </div>
          )}
          {state.message && (
            <div className="mb-6 p-4 bg-red-900 text-white rounded-md">
              {state.message}
            </div>
          )}
  
        {/* Theme playback preview button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={toggleThemePlayback}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
          >
            {isPlaybackModalOpen ? 'Hide Preview' : 'Preview Original Theme'}
          </button>
        </div>
  
        {/* Recording controls */}
        <RecordingControls
          isRecording={isRecording}
          isVideoMode={isVideoMode}
          setIsVideoMode={setIsVideoMode}
          metronomeEnabled={metronomeEnabled}
          setMetronomeEnabled={setMetronomeEnabled}
          onStartStopRecording={handleStartStopRecording}
          onFileChange={handleFileChange}
          file={file}
        />
  
        {/* Hidden file input for form submission */}
        <input 
          type="file" 
          name="audioFile" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          aria-hidden="true"
        />
        
        {/* Hidden input for theme ID */}
        <input type="hidden" name="themeId" value={theme.id} />
  
        {/* Media player for theme preview */}
        <MediaPlayer
          mediaURL={theme.recording_url}
          isOpen={isPlaybackModalOpen}
          onClose={toggleThemePlayback}
        />
  
        {/* Audio mixing section - show after file is recorded/uploaded */}
        {file && !mixedFile && !showMixer && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Audio Mixing</h3>
            <p className="text-gray-300 mb-4">
              Mix your layer with the original theme to create the final audio, or save just your layer.
            </p>
            
            {mixingError && (
              <div className="p-3 bg-red-900 text-white rounded-md mb-4">
                {mixingError}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={startAudioMixing}
                disabled={!file}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Mix with Original Theme
              </button>
              <button
                type="button"
                onClick={() => {
                  // Skip mixing and use the original file as mixed file
                  setMixedFile(file);
                  logger.debug('[AddLayerForm] Skipping mixing, using raw layer');
                }}
                disabled={!file}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Save Layer Only
              </button>
            </div>
          </div>
        )}

        {/* Client-side audio mixer component */}
        {showMixer && file && (
          <div className="mt-6">
            <ClientAudioMixer
              originalAudioUrl={theme.recording_url}
              layerAudioUrl={file}
              onMixComplete={handleMixComplete}
              onMixError={handleMixError}
              onProgress={handleMixProgress}
            />
          </div>
        )}

        {/* Show mixed audio success message */}
        {mixedFile && (
          <div className="mt-6 p-4 bg-green-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">✓ Audio Ready</h3>
            <p className="text-green-200">
              {mixedFile === file ? 
                'Your layer is ready to save (layer only).' :
                'Your layer has been mixed with the original theme and is ready to save.'
              }
            </p>
          </div>
        )}
  
        {/* Show metadata form if we have a file */}
        {file && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">Layer Details</h3>
            <LayerMetadataForm
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
            
            {/* Hidden form inputs for metadata */}
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="description" value={description} />
            <input type="hidden" name="genre" value={genre} />
            <input type="hidden" name="keySignature" value={keySignature} />
            <input type="hidden" name="tempo" value={tempo.toString()} />
            <input type="hidden" name="scale" value={scale} />
            <input type="hidden" name="chords" value={chords} />
            <input type="hidden" name="instrument" value={instrument} />
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="duration" value={duration} />
            
            {/* Submit button */}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isPending || showSuccess || (file && !mixedFile)} // Disabled if pending, showing success, or if we have file but no mixed file
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-600"
              >
                {isPending ? 'Saving...' : 
                 (file && !mixedFile) ? 'Mix Audio First' : 
                 'Save Layer'}
              </button>
            </div>
          </div>
        )}
        </div>
      </form>
    </>
  );
}