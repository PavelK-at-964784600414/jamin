'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { CollaborationDisplayData } from '@/app/lib/definitions';
import { createLayer, LayerState } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import RecordingControls from '@/app/ui/themes/RecordingControls';
import LayerMetadataForm from '@/app/ui/themes/LayerMetadataForm';
import ClientAudioMixer from '@/app/components/ClientAudioMixer';
import { getSupportedAudioFormats, validateAudioFile, getAudioDuration } from '@/app/lib/audio-utils';
import { logger } from '@/app/lib/logger';

interface AddLayerToCollabFormProps {
  collaboration: CollaborationDisplayData;
}

export default function AddLayerToCollabForm({ collaboration }: AddLayerToCollabFormProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Initialize the form state for server action response with proper typing
  const initialState: LayerState = { 
    message: null, 
    errors: {},
    success: false,
    themeId: undefined 
  };
  
  // Use useActionState with explicit typing
  const [state, formAction, isPending] = useActionState<LayerState, FormData>(
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio mixing state
  const [showMixer, setShowMixer] = useState(false);
  const [mixingProgress, setMixingProgress] = useState(0);
  const [mixingError, setMixingError] = useState<string | null>(null);
  
  // Collaboration playback - multiple audio sources
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  
  // Form state
  const [title, setTitle] = useState(`${collaboration.parent_theme_title} - Layer ${collaboration.total_layers_count + 1}`);
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [keySignature, setKeySignature] = useState('');
  const [tempo, setTempo] = useState(120);
  const [scale, setScale] = useState('');
  const [chords, setChords] = useState('');
  const [instrument, setInstrument] = useState('Piano'); // Set a default instrument
  const [mode, setMode] = useState('');
  const [duration, setDuration] = useState(0); // Add duration state

  // Form submission state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle successful form submission
  useEffect(() => {
    if (state?.success) {
      setSuccess('Layer added successfully! Redirecting...');
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/collabs');
      }, 2000);
    }
  }, [state?.success, router]);

  // Initialize audio element for the complete collaboration recording only
  useEffect(() => {
    logger.debug('Collaboration data for audio mixing:', { 
      metadata: { 
        collab_id: collaboration.collab_id,
        recording_url: collaboration.collab_recording_url,
        parent_theme_recording_url: collaboration.parent_theme_recording_url,
        has_recording: !!(collaboration.collab_recording_url || collaboration.parent_theme_recording_url),
        total_layers: collaboration.total_layers_count 
      } 
    });
    
    // Use the collaboration recording if available, otherwise use the parent theme recording
    const baseAudioUrl = collaboration.collab_recording_url || collaboration.parent_theme_recording_url;
    
    if (baseAudioUrl) {
      const audio = new Audio();
      audio.src = baseAudioUrl;
      audio.preload = 'auto';
      setAudioElements([audio]);
      
      return () => {
        // Clean up audio element
        audio.pause();
      };
    } else {
      setAudioElements([]);
      logger.warn('No collaboration or theme recording URL found - mixing may not work properly');
      // Return undefined explicitly for the else case
      return undefined;
    }
  }, [collaboration]);

  // Play all audio layers simultaneously (like a mixer)
  const playCollaboration = async () => {
    try {
      setIsPlaying(true);
      
      // Reset all audio to beginning and play simultaneously
      const playPromises = audioElements.map(audio => {
        audio.currentTime = 0;
        return audio.play();
      });
      
      await Promise.all(playPromises);
      
      // Set up event listener for when the longest audio ends
      const durations = audioElements.map(audio => audio.duration);
      const maxDuration = Math.max(...durations);
      
      setTimeout(() => {
        setIsPlaying(false);
      }, maxDuration * 1000);
      
    } catch (error) {
      logger.error("Error playing collaboration", { metadata: { error: error instanceof Error ? error.message : String(error) } });
      setError("Failed to play the collaboration. Please try again.");
      setIsPlaying(false);
    }
  };

  // Stop collaboration playback
  const stopCollaboration = () => {
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setIsPlaying(false);
  };

  // Start/stop recording
  const handleStartStopRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Stop collaboration playback
      stopCollaboration();
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
        const formats = getSupportedAudioFormats();
        const mimeType = isVideoMode 
          ? formats.video.preferredFormat 
          : formats.audio.preferredFormat;
        
        const mediaRecorder = new MediaRecorder(stream, { 
          mimeType: mimeType,
          audioBitsPerSecond: 128000
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
          const mimeType = mediaRecorder.mimeType || (isVideoMode ? 'video/webm' : 'audio/webm');
          const recordedBlob = new Blob(chunks, { type: mimeType });
          
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';
          else if (mimeType.includes('mp3')) extension = 'mp3';
          else if (mimeType.includes('wav')) extension = 'wav';
          
          // Use a stable filename that doesn't change on re-render
          const timestamp = new Date().getTime();
          const fileName = `collab-layer-${timestamp}.${extension}`;
          const recordedFile = new File([recordedBlob], fileName, { 
            type: mimeType,
            lastModified: timestamp
          });
          
          setFile(recordedFile);
          
          // Get duration for recorded audio/video
          if (!isVideoMode && recordedFile.type.startsWith('audio/')) {
            try {
              const recordedDuration = await getAudioDuration(recordedFile);
              setDuration(recordedDuration);
              logger.debug('Recorded collaboration layer duration set to', { metadata: { duration: recordedDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get recorded collaboration layer duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else if (isVideoMode && recordedFile.type.startsWith('video/')) {
            try {
              const { getVideoDuration } = await import('@/app/lib/video-utils');
              const videoDuration = await getVideoDuration(recordedFile);
              setDuration(videoDuration);
              logger.debug('Recorded collaboration video duration set to', { metadata: { duration: videoDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get recorded collaboration video duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
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
        
        // Start collaboration playback
        await playCollaboration();
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
      
      try {
        // Use appropriate validation for file type
        let isValid = false;
        if (selectedFile.type.startsWith('video/')) {
          const { validateVideoFile } = await import('@/app/lib/video-utils');
          isValid = await validateVideoFile(selectedFile);
        } else {
          isValid = await validateAudioFile(selectedFile);
        }
        if (isValid) {
          setFile(selectedFile);
          setError(null);
          
          // Get duration for uploaded audio/video file
          if (selectedFile.type.startsWith('audio/')) {
            try {
              const fileDuration = await getAudioDuration(selectedFile);
              setDuration(fileDuration);
              logger.debug('Uploaded collaboration layer duration set to', { metadata: { duration: fileDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get uploaded collaboration layer duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else if (selectedFile.type.startsWith('video/')) {
            try {
              const { getVideoDuration } = await import('@/app/lib/video-utils');
              const videoDuration = await getVideoDuration(selectedFile);
              setDuration(videoDuration);
              logger.debug('Uploaded collaboration video duration set to', { metadata: { duration: videoDuration, unit: 'seconds' } });
            } catch (error) {
              logger.error('Failed to get uploaded collaboration video duration', { metadata: { error: error instanceof Error ? error.message : String(error) } });
              setDuration(0);
            }
          } else {
            setDuration(0);
          }
        } else {
          setError('The selected file appears to be invalid or corrupted. Please try another file.');
          e.target.value = '';
        }
      } catch (validationError) {
        logger.error('Error validating file', { metadata: { error: validationError instanceof Error ? validationError.message : String(validationError) } });
        setFile(selectedFile);
      }
    }
  };

  // Audio mixing handlers (for client-side mixing with collaboration audio)
  const handleMixComplete = (mixedAudioBlob: Blob) => {
    // Convert blob to file
    const mixedFileName = `mixed-${Date.now()}.mp4`;
    const mixedAudioFile = new File([mixedAudioBlob], mixedFileName, { 
      type: 'audio/mp4'
    });
    
    logger.debug('Client-side audio mixing completed for collaboration layer');
    setMixedFile(mixedAudioFile);
    setShowMixer(false);
    setMixingError(null);
  };

  const handleMixError = (error: string) => {
    logger.error('Client-side audio mixing failed for collaboration layer', { metadata: { error } });
    setMixingError(error);
    setShowMixer(false);
  };

  const handleMixProgress = (progress: number) => {
    setMixingProgress(progress);
  };

  // Start mixing process
  const startAudioMixing = () => {
    setMixingError(null);
    setMixingProgress(0);
    setShowMixer(true);
  };

  // Maximum file size: 500MB (increased for video files)
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  const ALLOWED_AUDIO_TYPES = [
    'audio/webm', 'audio/mp3', 'audio/mp4', 'video/mp4',
    'audio/wav', 'audio/mpeg', 'video/webm',
  ];

  // Form submission preparation
  const prepareFormSubmission = async () => {
    setError(null);
    setSuccess(null);
    
    // Check either original file or mixed file
    const fileToCheck = mixedFile || file;
    if (!fileToCheck) {
      setError('No file to save. Please record or upload a file first.');
      return false;
    }
    
    if (fileToCheck.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return false;
    }
    
    if (!ALLOWED_AUDIO_TYPES.includes(fileToCheck.type)) {
      const isAudioFile = fileToCheck.type.startsWith('audio/') || fileToCheck.type.startsWith('video/');
      if (!isAudioFile) {
        setError('Invalid file type. Please upload a supported audio format.');
        return false;
      }
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Always prevent default to handle manually
    
    const isValid = await prepareFormSubmission();
    if (!isValid) {
      return;
    }
    
    // Create FormData manually to ensure file is included
    const formData = new FormData();
    
    // Add all form fields
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genre', genre);
    formData.append('keySignature', keySignature);
    formData.append('tempo', tempo.toString());
    formData.append('scale', scale);
    formData.append('chords', chords);
    formData.append('instrument', instrument);
    formData.append('mode', mode);
    formData.append('duration', duration.toString());
    formData.append('collaborationId', collaboration.collab_id);
    
    // Add the file (use mixed file if available, otherwise use original file)
    const finalFile = mixedFile || file;
    if (finalFile) {
      formData.append('audioFile', finalFile);
      logger.debug('File attached to form', { metadata: { name: finalFile.name, type: finalFile.type, size: finalFile.size, isMixed: !!mixedFile } });
    }
    
    // Call the server action directly
    await formAction(formData);
  };

  return (
    <div className="w-full">
      {!isClient ? (
        // Show loading state during hydration
        <div className="flex items-center justify-center p-8">
          <div className="text-white">Loading...</div>
        </div>
      ) : (
        <>
          {/* Collaboration Playback Controls */}
          <div className="mb-6 bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Listen to Collaboration</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={isPlaying ? stopCollaboration : playCollaboration}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isPlaying 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={audioElements.length === 0}
              >
                {isPlaying ? 'Stop' : 'Play All Layers'}
              </button>
              <span className="text-gray-400 text-sm">
                {audioElements.length} audio layer{audioElements.length !== 1 ? 's' : ''} loaded
              </span>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="mb-6">
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
          </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Hidden form inputs for server action */}
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="genre" value={genre} />
        <input type="hidden" name="keySignature" value={keySignature} />
        <input type="hidden" name="tempo" value={tempo.toString()} />
        <input type="hidden" name="scale" value={scale} />
        <input type="hidden" name="chords" value={chords} />
        <input type="hidden" name="instrument" value={instrument} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="duration" value={duration.toString()} />
        <input type="hidden" name="collaborationId" value={collaboration.collab_id} />
        
        {/* Hidden file input for the recorded/uploaded file */}
        <input 
          ref={fileInputRef}
          type="file" 
          name="audioFile" 
          accept="audio/*,video/*"
          style={{ display: 'none' }}
          onChange={() => {}} // Controlled by the RecordingControls component
        />

        {/* Debug info to understand button visibility */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-800 rounded-lg text-sm">
            <h4 className="text-white font-semibold mb-2">Debug Info:</h4>
            <div className="text-yellow-200 space-y-1">
              <div>file: {file ? `${file.name} (${file.type})` : 'null'}</div>
              <div>mixedFile: {mixedFile ? `${mixedFile.name} (${mixedFile.type})` : 'null'}</div>
              <div>showMixer: {showMixer.toString()}</div>
              <div>collaboration.collab_recording_url: {collaboration.collab_recording_url || 'null'}</div>
              <div>collaboration.parent_theme_recording_url: {collaboration.parent_theme_recording_url || 'null'}</div>
              <div>baseAudioUrl: {(collaboration.collab_recording_url || collaboration.parent_theme_recording_url) || 'null'}</div>
              <div>Should show Mix Audio: {String(!!(file && !mixedFile && !showMixer))}</div>
            </div>
          </div>
        )}

        {/* Audio Mixing Section */}
        {file && !mixedFile && !showMixer && (
          <div className="mt-6 p-6 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">🎵 Audio Mixing</h3>
            <p className="text-gray-300 mb-4">
              Mix your layer with the existing collaboration audio for the best sound quality.
            </p>
            
            {mixingError && (
              <div className="p-3 bg-red-900 text-white rounded-md mb-4">
                {mixingError}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={startAudioMixing}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
              >
                🎚️ Mix Audio
              </button>
              <button
                type="button"
                onClick={() => {
                  // Skip mixing - use layer only
                  setMixedFile(file);
                  logger.debug('[CollabAddLayerForm] Skipping mixing, using raw layer');
                }}
                className="px-6 py-3 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
              >
                Skip Mixing (Layer Only)
              </button>
            </div>
          </div>
        )}

        {/* Client-side audio mixer component */}
        {showMixer && file && (
          <div className="mt-6">
            <ClientAudioMixer
              originalAudioUrl={collaboration.collab_recording_url || collaboration.parent_theme_recording_url || ''}
              layerAudioUrl={file}
              onMixComplete={handleMixComplete}
              onMixError={handleMixError}
              onProgress={handleMixProgress}
            />
          </div>
        )}

        {/* Show mixing error */}
        {mixingError && (
          <div className="mt-6 p-4 bg-red-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">❌ Mixing Failed</h3>
            <p className="text-red-200 mb-4">{mixingError}</p>
            <button
              type="button"
              onClick={() => {
                setMixingError(null);
                // Allow user to try again or skip mixing
                setMixedFile(file);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Skip Mixing (Use Layer Only)
            </button>
          </div>
        )}

        {/* Show mixed audio success message */}
        {mixedFile && (
          <div className="mt-6 p-4 bg-green-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">✓ Audio Ready</h3>
            <p className="text-green-200">
              {mixedFile === file ? 
                'Your layer is ready to save (layer only).' :
                'Your layer has been mixed with the existing collaboration and is ready to save.'
              }
            </p>
          </div>
        )}

        {/* Display validation errors */}
        {state?.errors && Object.keys(state.errors).length > 0 && (
          <div className="p-4 bg-red-900 text-red-200 rounded-md">
            <h4 className="font-semibold mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(state.errors).map(([field, errors]) => (
                <li key={field}>
                  <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="p-4 bg-red-900 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900 text-green-200 rounded-md">
            {success}
          </div>
        )}

        {state?.message && (
          <div className={`p-4 rounded-md ${
            state.success 
              ? 'bg-green-900 text-green-200' 
              : 'bg-red-900 text-red-200'
          }`}>
            {state.message}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending || !file || !mixedFile || showMixer}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              isPending || !file || !mixedFile || showMixer
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPending ? 'Saving Layer...' : 
             showMixer ? 'Mixing Audio...' :
             !mixedFile ? 'Mix Audio First' :
             'Save Layer'}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
