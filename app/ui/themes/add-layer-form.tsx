'use client';

import { useState, useRef, useEffect, useActionState } from 'react'; // Changed import
import { ThemesTable } from '@/app/lib/definitions';
import { createLayer, LayerState } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import RecordingControls from './RecordingControls';
import MediaPlayer from './MediaPlayer';
import LayerMetadataForm from './LayerMetadataForm';
import { getSupportedAudioFormats, validateAudioFile, getAudioDuration } from '@/app/lib/audio-utils';
import { logger } from '@/app/lib/logger';

interface AddLayerFormProps {
  theme: ThemesTable;
}

export default function AddLayerForm({ theme }: AddLayerFormProps) {
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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // File validation
    if (!file) {
      setError('No file to save. Please record or upload a file first.');
      return false;
    }
    
    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return false;
    }
    
    // File type validation
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      // If file type is not in allowed list, check if it's a known audio type
      const isAudioFile = file.type.startsWith('audio/') || file.type.startsWith('video/');
      if (!isAudioFile) {
        setError('Invalid file type. Please upload a supported audio format.');
        return false;
      }
      // If it's an audio type but not in our allowed list, we'll still try to process it
      logger.warn(`File type ${file.type} not in allowed list, but appears to be audio/video`);
    }
    
    // Validate that the media file is playable (use appropriate validation for file type)
    try {
      let isValid = false;
      if (file.type.startsWith('video/')) {
        const { validateVideoFile } = await import('@/app/lib/video-utils');
        isValid = await validateVideoFile(file);
      } else {
        isValid = await validateAudioFile(file);
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
    if (!file) {
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

  const router = useRouter();

  useEffect(() => {
    // After form submission via formAction, handle success or errors
    if (state?.message) {
      setError(state.message);
      setSuccess(null); // Clear success message if there's an error
    } else if (state?.success) {
      // If the submission was successful
      setSuccess('Layer saved successfully!');
      setFile(null);
      setRecordedChunks([]);
      
      // Add a small delay before redirecting so user can see the success message
      const redirectTimer = setTimeout(() => {
        if (state.themeId) {
          router.push(`/dashboard/themes/${state.themeId}`);
        }
      }, 1500);
      
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

  // Handle form submission in a Safari-compatible way
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // First validate the form data
    if (!await validateFormData()) {
      return;
    }

    try {
      // Create a fresh FormData instance for Safari compatibility
      const safeFormData = new FormData();
      
      // Manually append all form fields
      safeFormData.append('title', title);
      safeFormData.append('description', description);
      safeFormData.append('genre', genre);
      safeFormData.append('keySignature', keySignature);
      safeFormData.append('tempo', tempo.toString());
      safeFormData.append('scale', scale);
      safeFormData.append('chords', chords);
      safeFormData.append('instrument', instrument);
      safeFormData.append('mode', mode);
      safeFormData.append('themeId', theme.id);
      
      // Special handling for file upload in Safari
      if (file) {
        try {
          // Use FileReader approach first which is more compatible with Safari
          const safeFile = await new Promise<File>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                  throw new Error('FileReader did not produce a result');
                }
                
                // Determine a safe MIME type
                let safeMimeType = file.type || 'audio/webm';
                if (!safeMimeType || safeMimeType === '') {
                  // If no mime type, try to determine from extension
                  if (file.name.endsWith('.mp3')) safeMimeType = 'audio/mpeg';
                  else if (file.name.endsWith('.wav')) safeMimeType = 'audio/wav';
                  else if (file.name.endsWith('.webm')) safeMimeType = 'audio/webm';
                  else if (file.name.endsWith('.mp4')) safeMimeType = 'video/mp4';
                  else safeMimeType = 'audio/webm'; // Default fallback
                }
                
                // Create a completely new blob and file object
                const fileBlob = new Blob([arrayBuffer], { type: safeMimeType });
                const fileName = file.name || `recording-${Date.now()}.webm`;
                
                // Create a new File with the content
                const newFile = new File([fileBlob], fileName, { 
                  type: safeMimeType,
                  lastModified: Date.now() // Use current timestamp for consistency
                });
                
                resolve(newFile);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = () => reject(new Error('FileReader failed'));
            reader.readAsArrayBuffer(file);
          });
          
          // Append the safe file to the form data
          safeFormData.append('audioFile', safeFile);
          logger.debug('Using FileReader approach for Safari compatibility');
        } catch (error) {
          logger.error('Error with FileReader approach', { metadata: { error: error instanceof Error ? error.message : String(error) } });
          try {
            // Fallback: Try to create a new simple Blob and File
            const blobType = file.type || 'audio/webm';
            const fileName = file.name || `recording-${Date.now()}.webm`;
            
            // Just create a simple copy using slice()
            const fileBlob = file.slice(0, file.size, blobType);
            const safeFile = new File([fileBlob], fileName, { 
              type: blobType,
              lastModified: Date.now()
            });
            safeFormData.append('audioFile', safeFile);
            logger.debug('Using slice fallback for Safari compatibility');
          } catch (fallbackError) {
            logger.error('All safe approaches failed', { metadata: { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) } });
            // Last resort - direct append and hope for the best
            safeFormData.append('audioFile', file);
            logger.debug('Using direct file append as last resort');
          }
        }
      }
      
      // Submit form using the server action
      logger.debug('Submitting form with data', {
        metadata: {
          title: safeFormData.get('title'),
          hasFile: !!safeFormData.get('audioFile')
        }
      });
      
      await formAction(safeFormData);
      
      // The form submission result is handled in the useEffect through the updated state
    } catch (e) {
      logger.error('Error saving layer', { metadata: { data: e } });
      // Using the correctly typed error state
      setError('Failed to save layer. Please try again.');
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="bg-gray-900 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Add a New Layer</h2>
          <p className="text-gray-300">
            Record or upload your layer while listening to the original theme. 
            The original theme will play during recording for synchronization.
          </p>
        </div>
  
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
  
        {/* Show success or error message */}
        {error && (
          <div className="p-4 bg-red-900 text-white rounded-md my-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-900 text-white rounded-md my-4">
            {success}
          </div>
        )}
        {state.message && (
          <div className="p-4 bg-red-900 text-white rounded-md my-4">
            {state.message}
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
                disabled={isPending} // Use isPending from useActionState
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-600"
              >
                {isPending ? 'Saving...' : 'Save Layer'} {/* Use isPending */}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
