'use client';

import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { CollaborationDisplayData } from '@/app/lib/definitions';
import Image from 'next/image';
import { formatDateToLocal, formatTimestampToLocal } from '@/app/lib/utils';
import Link from 'next/link';
import {
  MusicalNoteIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import MediaPlayerModal from '@/app/ui/themes/MediaPlayer';

interface CollabPageClientProps {
  collaborations: CollaborationDisplayData[];
}

export default function CollabPageClient({ collaborations }: CollabPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);

  const handlePlayClick = (mediaUrl: string) => {
    setSelectedMediaUrl(mediaUrl);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMediaUrl(null);
  };

  return (
    <>
      <main>
        <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
          Collaborations
        </h1>
        <p className="mb-8 text-gray-400">
          Each collaboration represents a musical journey - starting with an original theme and growing with each layer added by the community.
        </p>

        <div className="mt-6 flow-root">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden rounded-lg bg-gray-800 shadow-xl md:pt-0">
                {collaborations && collaborations.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700 text-gray-300">
                    <thead className="bg-gray-850">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-sm font-semibold text-gray-200"
                        >
                          Collaboration
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200"
                        >
                          Participants
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200"
                        >
                          Total Layers
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200"
                        >
                          Latest Addition
                        </th>
                        <th
                          scope="col"
                          className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                        >
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-750 bg-gray-800">
                      {collaborations.map((collab: CollaborationDisplayData) => (
                        <tr
                          key={collab.collab_id}
                          className="hover:bg-gray-750 transition-colors"
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-sm">
                            <div className="flex items-center">
                              {collab.collab_creator_image_url && (
                                <Image
                                  src={collab.collab_creator_image_url}
                                  alt={`${collab.collab_creator_name}'s avatar`}
                                  width={32}
                                  height={32}
                                  className="rounded-full mr-3"
                                />
                              )}
                              <div>
                                <div className="font-medium text-sky-400">
                                  {collab.collab_title} ({collab.collab_instrument})
                                </div>
                                <p className="text-xs text-gray-400">
                                  Latest layer by: {collab.collab_creator_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Added: {formatDateToLocal(collab.collab_date)}
                                </p>
                                <div className="mt-1 text-xs text-gray-400">
                                  Built on: 
                                  <Link
                                    href={`/dashboard/themes/${collab.parent_theme_id}`}
                                    className="ml-1 text-yellow-400 hover:text-yellow-300"
                                  >
                                    {collab.parent_theme_title}
                                  </Link>
                                  <span className="text-gray-500 ml-1">
                                    by {collab.parent_theme_creator_name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex -space-x-2 overflow-hidden">
                              {collab.participants.slice(0, 4).map((participant) =>
                                participant.image_url && (
                                  <Image
                                    key={participant.id}
                                    src={participant.image_url}
                                    alt={participant.name}
                                    width={28}
                                    height={28}
                                    className="inline-block rounded-full ring-2 ring-gray-800"
                                    title={participant.name}
                                  />
                                )
                              )}
                            </div>
                            {collab.participants.length > 4 && (
                              <span className="text-xs text-gray-400 ml-1">
                                +{collab.participants.length - 4} more
                              </span>
                            )}
                            {collab.participants.length === 0 && (
                              <span className="text-xs text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                            <div className="flex items-center justify-center">
                              <MusicalNoteIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {collab.total_layers_count}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {formatTimestampToLocal(collab.collab_date)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              {collab.collab_recording_url && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayClick(collab.collab_recording_url!);
                                  }}
                                  className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                                  aria-label={`Play collaboration ${collab.collab_title}`}
                                  title="Play Latest Layer"
                                  type="button"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                              <Link
                                href={`/dashboard/themes/${collab.parent_theme_id}`}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                View Theme
                                <span className="sr-only">
                                  , {collab.parent_theme_title}
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-200">
                      No collaborations yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Get started by adding layers to existing themes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Media Player Modal */}
      <MediaPlayerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mediaURL={selectedMediaUrl}
      />
    </>
  );
}
