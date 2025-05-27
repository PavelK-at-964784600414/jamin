'use client';

import { useState, useRef, useEffect, useActionState } from 'react'; // Changed import
import { ThemesTable } from '@/app/lib/definitions';
import { createLayer, LayerState } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import RecordingControls from './RecordingControls';
import MediaPlayer from './MediaPlayer';
import LayerMetadataForm from './LayerMetadataForm';
import { getSupportedAudioFormats, validateAudioFile } from '@/app/lib/audio-utils';

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
  const [instrument, setInstrument] = useState('');
  const [mode, setMode] = useState(theme.mode);

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
        
        console.log(`Using media recorder with MIME type: ${mimeType}`);
        
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
        
        mediaRecorder.onstop = () => {
          // Get the proper MIME type from the recorder
          const mimeType = mediaRecorder.mimeType || (isVideoMode ? 'video/webm' : 'audio/webm');
          console.log(`Recording completed with MIME type: ${mimeType}`);
          
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
          
          console.log(`Created recording file: ${fileName}, size: ${recordedBlob.size} bytes, type: ${mimeType}`);
          
          setFile(recordedFile);
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
              console.error("Error playing theme audio:", error);
              setError("Failed to play the original theme. Please try again.");
            });
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Failed to access your microphone or camera. Please check permissions.');
      }
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate the audio file
      try {
        // Check if the file is a valid audio file
        const isValid = await validateAudioFile(selectedFile);
        
        if (isValid) {
          console.log('File validated successfully:', selectedFile.name);
          setFile(selectedFile);
          setError(null);
        } else {
          console.error('Invalid audio file:', selectedFile.name);
          setError('The selected file appears to be invalid or corrupted. Please try another file.');
          e.target.value = ''; // Reset the input
        }
      } catch (validationError) {
        console.error('Error validating file:', validationError);
        setFile(selectedFile); // Still set the file, we'll try to handle it
      }
    }
  };

  // Toggle theme playback preview
  const toggleThemePlayback = () => {
    setIsPlaybackModalOpen(!isPlaybackModalOpen);
  };

  // Maximum file size: 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
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
      console.warn(`File type ${file.type} not in allowed list, but appears to be audio/video`);
    }
    
    // Validate that the audio file is playable
    try {
      const isValid = await validateAudioFile(file);
      if (!isValid) {
        console.warn('Audio validation detected potential issues with the file');
        // We'll still continue, but log the warning
      }
    } catch (error) {
      console.error('Error validating audio file:', error);
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
          console.log('Using FileReader approach for Safari compatibility');
        } catch (error) {
          console.error('Error with FileReader approach:', error);
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
            console.log('Using slice fallback for Safari compatibility');
          } catch (fallbackError) {
            console.error('All safe approaches failed:', fallbackError);
            // Last resort - direct append and hope for the best
            safeFormData.append('audioFile', file);
            console.log('Using direct file append as last resort');
          }
        }
      }
      
      // Submit form using the server action
      console.log('Submitting form with data', {
        title: safeFormData.get('title'),
        hasFile: !!safeFormData.get('audioFile')
      });
      
      await formAction(safeFormData);
      
      // The form submission result is handled in the useEffect through the updated state
    } catch (e) {
      console.error('Error saving layer:', e);
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
