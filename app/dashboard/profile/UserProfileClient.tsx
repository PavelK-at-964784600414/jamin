'use client';

import { useState } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { ThemesTableWithLikes, CollaborationDisplayDataWithLikes } from '@/app/lib/definitions';
import Image from 'next/image';
import { formatDateToLocal, formatTimestampToLocal } from '@/app/lib/utils';
import Link from 'next/link';
import LikeDislikeButton from '@/app/ui/like-dislike-button';
import {
  MusicalNoteIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  UserGroupIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import MediaPlayerModal from '@/app/ui/themes/MediaPlayer';
import { UpdateTheme, DeleteTheme } from '@/app/ui/themes/buttons';

interface UserProfileClientProps {
  themes: ThemesTableWithLikes[];
  collaborations: CollaborationDisplayDataWithLikes[];
  userName: string;
}

export default function UserProfileClient({ 
  themes, 
  collaborations, 
  userName 
}: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'collaborations'>('themes');
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
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <MicrophoneIcon className="h-8 w-8 mr-3" />
            <div>
              <p className="text-blue-100 text-sm">Original Themes</p>
              <p className="text-2xl font-bold">{themes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 mr-3" />
            <div>
              <p className="text-green-100 text-sm">Collaborations</p>
              <p className="text-2xl font-bold">{collaborations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <div className="flex items-center">
            <MusicalNoteIcon className="h-8 w-8 mr-3" />
            <div>
              <p className="text-purple-100 text-sm">Total Contributions</p>
              <p className="text-2xl font-bold">{themes.length + collaborations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('themes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'themes'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              My Themes ({themes.length})
            </button>
            <button
              onClick={() => setActiveTab('collaborations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'collaborations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              My Collaborations ({collaborations.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            {activeTab === 'themes' ? (
              // Themes Tab
              <div className="overflow-hidden rounded-lg bg-gray-800 shadow-xl">
                {themes && themes.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700 text-gray-300">
                    <thead className="bg-gray-850">
                      <tr>
                        <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Theme
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Details
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Created
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-750 bg-gray-800">
                      {themes.map((theme) => (
                        <tr key={theme.id} className="hover:bg-gray-750 transition-colors">
                          <td className="whitespace-nowrap px-4 py-4 text-sm">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                  <MicrophoneIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-sky-400">{theme.title}</div>
                                <div className="text-gray-400 text-sm">
                                  {theme.description || 'No description'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="text-gray-300">
                              <div className="flex items-center mb-1">
                                <span className="text-xs text-gray-400 mr-2">Key:</span>
                                <span>{theme.key} {theme.mode}</span>
                              </div>
                              <div className="flex items-center mb-1">
                                <span className="text-xs text-gray-400 mr-2">Tempo:</span>
                                <span>{theme.tempo} BPM</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-400 mr-2">Instrument:</span>
                                <span>{theme.instrument}</span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {formatDateToLocal(theme.date)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              theme.status === 'complete' 
                                ? 'bg-green-900 text-green-200' 
                                : 'bg-yellow-900 text-yellow-200'
                            }`}>
                              {theme.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-2">
                              {theme.recording_url && (
                                <button
                                  onClick={() => handlePlayClick(theme.recording_url)}
                                  className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                                  aria-label={`Play theme ${theme.title}`}
                                  title="Play Theme"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                              <LikeDislikeButton
                                itemId={theme.id}
                                itemType="theme"
                                likeStats={theme.like_stats}
                                size="sm"
                              />
                              <UpdateTheme id={theme.id} />
                              <DeleteTheme id={theme.id} />
                              <Link
                                href={`/dashboard/themes/${theme.id}`}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                View Details
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No themes yet</h3>
                    <p className="text-gray-400 mb-4">Start your musical journey by creating your first theme.</p>
                    <Link
                      href="/dashboard/themes/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Your First Theme
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              // Collaborations Tab
              <div className="overflow-hidden rounded-lg bg-gray-800 shadow-xl">
                {collaborations && collaborations.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-700 text-gray-300">
                    <thead className="bg-gray-850">
                      <tr>
                        <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Collaboration
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Participants
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Total Layers
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                          Latest Activity
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-750 bg-gray-800">
                      {collaborations.map((collab) => (
                        <tr key={collab.collab_id} className="hover:bg-gray-750 transition-colors">
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
                                  onClick={() => handlePlayClick(collab.collab_recording_url!)}
                                  className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                                  aria-label={`Play collaboration ${collab.collab_title}`}
                                  title="Play Latest Layer"
                                >
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                              )}
                              <LikeDislikeButton
                                itemId={collab.collab_id}
                                itemType="collaboration"
                                likeStats={collab.like_stats}
                                size="sm"
                              />
                              <Link
                                href={`/dashboard/themes/${collab.parent_theme_id}`}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                View Theme
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-200 mb-2">No collaborations yet</h3>
                    <p className="text-gray-400 mb-4">Start collaborating by adding layers to existing themes.</p>
                    <Link
                      href="/dashboard/themes"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Browse Themes to Collaborate
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Player Modal */}
      <MediaPlayerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        mediaURL={selectedMediaUrl}
      />
    </>
  );
}
