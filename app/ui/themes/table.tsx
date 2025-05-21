'use client';

import Image from 'next/image';
import { UpdateTheme, DeleteTheme } from '@/app/ui/themes/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import { ThemesTable as ThemesTableType } from '@/app/lib/definitions';
import MediaPlayerModal from '@/app/ui/themes/MediaPlayer';
import React, { useState, useEffect } from 'react';
import { PlayIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/ui/themes/accordion'; // Import accordion components

export default function ThemesTable({
  themes,
}: {
  themes: ThemesTableType[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handlePlayClick = (mediaUrl: string) => {
    setSelectedMediaUrl(mediaUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMediaUrl(null);
  };

  if (!hydrated) {
    // Or a loading skeleton consistent with dark theme
    return <div className="mt-6 w-full h-40 rounded-md bg-gray-800 animate-pulse"></div>;
  }

  if (!themes || themes.length === 0) {
    return (
      <div className="mt-6 text-center text-gray-400">
        No themes found.
      </div>
    );
  }

  return (
    <>
      <MediaPlayerModal 
        mediaURL={selectedMediaUrl}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          {/* Main container for accordion will have dark background from accordion.tsx */}
          <Accordion type="single">
            {themes.map((theme) => (
              <AccordionItem key={theme.id} value={theme.id}>
                <AccordionTrigger>
                  <div className="flex w-full items-center gap-3 text-gray-200">
                    <Image
                      src={theme.image_url}
                      className="rounded-full"
                      width={32}
                      height={32}
                      alt={`${theme.user_name}'s profile picture`}
                    />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-base">{theme.title}</span>
                      <span className="text-sm text-gray-400">{theme.user_name}</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex items-center gap-4 mb-4">
                    {theme.recording_url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayClick(theme.recording_url!);
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                        aria-label={`Play theme ${theme.title}`}
                        title="Play Theme"
                        type="button"
                      >
                        <PlayIcon className="w-6 h-6" />
                      </button>
                    )}
                    <UpdateTheme id={theme.id} />
                    <DeleteTheme id={theme.id} />
                  </div>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div><strong>Length:</strong> {typeof theme.seconds === 'number' ? `${Math.floor(theme.seconds / 60)}:${(theme.seconds % 60).toString().padStart(2, '0')}` : 'N/A'}</div>
                      <div><strong>Date:</strong> {formatDateToLocal(theme.date)}</div>
                      <div><strong>Key:</strong> {theme.key}</div>
                      <div><strong>Mode:</strong> {theme.mode}</div>
                      <div><strong>Tempo:</strong> {theme.tempo} BPM</div>
                      <div><strong>Instrument:</strong> {theme.instrument}</div>
                    </div>
                    <div>
                      <strong>Chords:</strong>
                      <p className="mt-1 text-xs p-2 bg-gray-700 rounded-md whitespace-pre-wrap">{theme.chords || 'Not specified'}</p>
                    </div>
                    {theme.description && (
                      <div>
                        <strong>Description:</strong>
                        <p className="mt-1 text-xs p-2 bg-gray-700 rounded-md">{theme.description}</p>
                      </div>
                    )}
                    <div className="mt-3 border-t border-gray-700 pt-3 flex items-center justify-between gap-3">
                      <a 
                        href={`/dashboard/themes/${theme.id}/add-layer`} 
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Add Layer
                      </a>
                      <div className="flex items-center gap-2">
                        {/* Additional buttons can go here if needed */}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
}
