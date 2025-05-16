'use client';

import { useState, useRef, useEffect } from 'react';
import { ThemesTable } from '@/app/lib/definitions';
import { createLayer, LayerState } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import RecordingControls from './RecordingControls';
import MediaPlayer from './MediaPlayer';
import LayerMetadataForm from './LayerMetadataForm';

interface AddLayerFormProps {
  theme: ThemesTable;
}

export default function AddLayerForm({ theme }: AddLayerFormProps) {
  // Initialize the form state for server action response
  const initialState: LayerState = { message: null, errors: {} };
  // Use useFormState directly with server action
  const [state, formAction] = useFormState(createLayer, initialState);
  
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

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        
        // Create media recorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        // Set up data handlers
        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const mimeType = isVideoMode ? 'video/webm' : 'audio/webm';
          const recordedBlob = new Blob(chunks, { type: mimeType });
          const fileName = `layer-${Date.now()}.${isVideoMode ? 'webm' : 'webm'}`;
          const recordedFile = new File([recordedBlob], fileName, { type: mimeType });
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
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
  const prepareFormSubmission = () => {
    setError(null);
    
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
      setError('Invalid file type. Please upload a supported audio format.');
      return false;
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
  const validateFormData = () => {
    return prepareFormSubmission();
  };

  const router = useRouter();

  useEffect(() => {
    // After form submission via formAction, handle success or errors
    if (state?.message) {
      setError(state.message);
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
    }
  }, [state, router]);

  // Handle form submission in a Safari-compatible way
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // First validate the form data
    if (!validateFormData()) {
      setIsSubmitting(false);
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
          // First, clone the file to avoid readonly property issues
          const fileArrayBuffer = await file.arrayBuffer();
          
          // Create a new Blob and then a new File to ensure Safari compatibility
          const fileBlob = new Blob([fileArrayBuffer], { type: file.type || 'audio/webm' });
          
          // Determine a safe MIME type
          const safeMimeType = file.type || 
            (file.name.endsWith('.mp3') ? 'audio/mpeg' : 
            (file.name.endsWith('.webm') ? 'audio/webm' : 
            'application/octet-stream'));
          
          // Create a new File with the safe MIME type
          // Using a new object completely disconnected from the original file
          const fileName = file.name || `recording-${Date.now()}.webm`;
          const safeFile = new File([fileBlob], fileName, { 
            type: safeMimeType,
            lastModified: Date.now() // Use current timestamp instead of original lastModified
          });
          
          // Append the safe file to the form data
          safeFormData.append('audioFile', safeFile);
          console.log('Using Safari-compatible file upload approach');
        } catch (error) {
          console.error('Error processing file for Safari:', error);
          try {
            // Alternative approach for Safari - create a completely new file with minimal properties
            const blobType = file.type || 'audio/webm';
            const blobName = file.name || `recording-${Date.now()}.webm`;
            
            // Use slice() to create a new Blob without modifying the original File object
            const fileBlob = file.slice(0, file.size, blobType);
            const fileName = file.name || `recording-${Date.now()}.webm`;
            const safeFile = new File([fileBlob], fileName, { 
              type: file.type || 'audio/webm',
              lastModified: Date.now() // Use current timestamp for Safari compatibility
            });
            safeFormData.append('audioFile', safeFile);
            console.log('Using alternative Safari-compatible approach');
          } catch (fallbackError) {
            console.error('Fallback approach failed:', fallbackError);
            // Last resort - try direct append
            safeFormData.append('audioFile', file);
            console.log('Using direct file append as last resort');
          }
        }
      }
      
      // Submit form using the server action
      await formAction(safeFormData);
    } catch (e) {
      console.error('Error saving layer:', e);
      // Using the correctly typed error state
      setError('Failed to save layer. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-600"
              >
                {isSubmitting ? 'Saving...' : 'Save Layer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
