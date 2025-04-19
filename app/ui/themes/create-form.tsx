'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { createTheme, State } from '@/app/lib/actions';
import { useActionState } from 'react';
import { saveAs } from 'file-saver';
import MetadataForm from './MetadataForm';
import RecordingControls from './RecordingControls';
import MediaPlayer from './MediaPlayer';
import { MicrophoneIcon } from '@heroicons/react/24/outline';

export default function CreateForm() {
  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createTheme, initialState);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
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

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      console.error('MediaRecorder API is not supported in this browser.');
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
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
              const v = dataArray[i] / 128.0;
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
  
      mediaRecorderRef.current.onstop = () => {
        if (mediaChunksRef.current.length === 0) {
          console.warn('No media data recorded.');
          return;
        }
        const recorderMimeType =
          mediaRecorderRef.current?.mimeType ||
          (!isVideoMode && supportedType) ||
          (isVideoMode ? 'video/webm' : 'audio/webm');
        const blob = new Blob(mediaChunksRef.current, { type: recorderMimeType });
        const blobUrl = URL.createObjectURL(blob);
        console.log('Blob URL:', blobUrl);
        setMediaURL(blobUrl);
        let extension = "webm";
        if (recorderMimeType) {
          extension = recorderMimeType.split("/")[1].split(";")[0];
        }
        setFile(new File([blob], `recording.${extension}`, { type: recorderMimeType }));
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
              .catch((error) => console.error("Metronome playback failed:", error));
          }
        }, interval);
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const handleStopRecording = () => {
    console.log('Stopping recording...');
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      console.log('Selected file URL:', url);
      setMediaURL(url);
    }
  };

  const handlePlayMedia = () => {
    if (mediaRef.current) {
      mediaRef.current.play().catch((error) =>
        console.error('Playback failed:', error)
      );
    }
  };

  const handleSaveFile = async () => {
    if (file) {
      try {
        const formData = new FormData();
        formData.append('audioFile', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('genre', genre);
        formData.append('keySignature', keySignature);  
        formData.append('scale', scale);
        formData.append('chords', chords);
        formData.append('tempo', tempo.toString());
        formData.append('instrument', instrument);
        formData.append('mode', mode); // Append the mode field

        console.log('Submitting form with file:', file.name);
        const response = await createTheme({}, formData);
        
        if (response?.message) {
          console.error('Error saving recording:', response.message);
        }
      } catch (error) {
        console.error('Error in handleSaveFile:', error);
      }
    }
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
      console.log('Loading media URL:', mediaURL);
      mediaRef.current.load();
    }
  }, [mediaURL]);

  return (
    <form action={formAction}>
      <div className="w-[500px] mx-auto">
        <MetadataForm 
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          genre={genre}
          onGenreChange={setGenre}
          keySignature={keySignature}  // Changed from 'key'
          onKeySignatureChange={setKeySignature}  // Changed from 'onKeyChange'
          tempo={tempo}
          onTempoChange={setTempo}
          scale={scale}
          onScaleChange={setScale}
          chords={chords}
          onChordsChange={setChords}
          instrument={instrument}
          onInstrumentChange={setInstrument}
          mode={mode}                     // Pass mode state
          onModeChange={setMode}
        />
        <RecordingControls 
          isRecording={isRecording}
          isVideoMode={isVideoMode}
          setIsVideoMode={setIsVideoMode}
          metronomeEnabled={metronomeEnabled}
          setMetronomeEnabled={setMetronomeEnabled}
          onStartStopRecording={isRecording ? handleStopRecording : handleStartRecording}
          onFileChange={handleFileChange}
          onSaveFile={handleSaveFile}
          file={file}
        />
        <MediaPlayer 
          mediaURL={mediaURL}
          isVideoMode={isVideoMode}
          isValidBlobUrl={isValidBlobUrl}
          onPlayMedia={handlePlayMedia}
        />
        <canvas ref={canvasRef} width={500} height={100} className="mt-4 border border-gray-600" />
        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/dashboard/themes"
            className="flex h-10 items-center rounded-lg bg-gray-700 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Cancel
          </Link>
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
            Create Theme
          </Button>
        </div>
        <div id="message" aria-live="polite" aria-atomic="true">
          {state.message && (
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