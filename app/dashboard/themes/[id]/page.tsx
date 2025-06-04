'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemesTable } from '@/app/lib/definitions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MicrophoneIcon, PlayIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import MediaPlayer from '@/app/ui/themes/MediaPlayer';
import { logger } from '@/app/lib/logger';

export default function ThemePage() {
  const { id } = useParams();
  const [theme, setTheme] = useState<ThemesTable | null>(null);
  const [layers, setLayers] = useState<ThemesTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);

  useEffect(() => {
    const loadThemeAndLayers = async () => {
      try {
        if (!id || Array.isArray(id)) {
          throw new Error('Invalid theme ID');
        }
        
        // Fetch data from our API endpoint instead of directly from the database
        const response = await fetch(`/api/themes/${id}`, {
          // Add cache: 'no-store' to avoid caching unauthorized responses
          cache: 'no-store',
          // Add credentials to ensure cookies are sent for authentication
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          } else if (response.status === 401) {
            // Handle authentication errors
            throw new Error('You must be logged in to view this theme');
          } else if (response.status === 429) {
            // Handle rate limiting
            throw new Error('Too many requests. Please try again later.');
          }
          throw new Error('Failed to fetch theme data');
        }
        
        const data = await response.json();
        
        setTheme(data.theme);
        setLayers(data.layers || []);
      } catch (err) {
        logger.error('Error loading theme', { metadata: { data: err } });
        setError('Failed to load theme. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadThemeAndLayers();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="text-xl text-gray-300">Loading theme...</div>
    </div>;
  }

  if (error || !theme) {
    return <div className="p-4 bg-red-900 text-white rounded-md">
      {error || 'Theme not found'}
    </div>;
  }

  return (
    <div className="w-full">
      <div className="mb-8 bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-4">{theme.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Theme Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-200">
              <dt className="text-gray-400">Artist:</dt>
              <dd>{theme.user_name}</dd>
              <dt className="text-gray-400">Key:</dt>
              <dd>{theme.key}</dd>
              <dt className="text-gray-400">Tempo:</dt>
              <dd>{theme.tempo} BPM</dd>
              <dt className="text-gray-400">Duration:</dt>
              <dd>{Math.floor(theme.seconds / 60)}:{(theme.seconds % 60).toString().padStart(2, '0')}</dd>
              {theme.instrument && (
                <>
                  <dt className="text-gray-400">Instrument:</dt>
                  <dd>{theme.instrument}</dd>
                </>
              )}
            </dl>
          </div>
          <div>
            {theme.description && (
              <>
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Description</h2>
                <p className="text-gray-200 bg-gray-700 p-3 rounded-md">{theme.description}</p>
              </>
            )}
            {theme.chords && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Chords</h2>
                <pre className="text-gray-200 bg-gray-700 p-3 rounded-md whitespace-pre-wrap font-mono text-sm">{theme.chords}</pre>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions and Playback */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setIsPlaybackModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            <PlayIcon className="h-5 w-5" />
            Play Theme
          </button>
          
          <Link
            href={`/dashboard/themes/${id}/add-layer`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
          >
            <MicrophoneIcon className="h-5 w-5" />
            Add Layer
          </Link>
          
          <Link
            href={`/dashboard/themes/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
          >
            <span>Edit Theme</span>
          </Link>
        </div>

        {/* Collaborative Layers Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Collaborative Layers</h2>
          
          {layers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {layers.map((layer) => (
                <div key={layer.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                        {layer.image_url ? (
                          <Image 
                            src={layer.image_url} 
                            alt={layer.user_name} 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <MusicalNoteIcon className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{layer.title}</h3>
                        <p className="text-gray-400 text-sm">By {layer.user_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        // Play this layer
                        // We could implement this later
                      }}
                      className="px-3 py-1 rounded bg-blue-700 text-white text-sm hover:bg-blue-800"
                    >
                      <PlayIcon className="h-4 w-4 inline mr-1" />
                      Play
                    </button>
                  </div>
                  
                  {layer.description && (
                    <p className="text-gray-300 text-sm mb-2">{layer.description}</p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    {layer.instrument && (
                      <div>
                        <span className="block">Instrument:</span>
                        <span className="text-gray-300">{layer.instrument}</span>
                      </div>
                    )}
                    <div>
                      <span className="block">Added:</span>
                      <span className="text-gray-300">{new Date(layer.date).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block">Duration:</span>
                      <span className="text-gray-300">
                        {Math.floor(layer.seconds / 60)}:{(layer.seconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-6 text-center">
              <p className="text-gray-300 mb-4">No layers added to this theme yet.</p>
              <Link
                href={`/dashboard/themes/${id}/add-layer`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors duration-200"
              >
                <MicrophoneIcon className="h-5 w-5" />
                Be the first to add a layer
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Theme Playback Modal */}
      <MediaPlayer
        mediaURL={theme.recording_url}
        isOpen={isPlaybackModalOpen}
        onClose={() => setIsPlaybackModalOpen(false)}
      />
    </div>
  );
}
