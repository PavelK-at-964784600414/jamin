'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDateToLocal, formatTimestampToLocal } from '@/app/lib/utils';
import { lusitana } from '@/app/ui/fonts';
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  UserIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  ClockIcon,
  MicrophoneIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import {
  ThemesTableWithLikes,
  CollaborationDisplayDataWithLikes
} from '@/app/lib/definitions';
import LikeDislikeButton from '@/app/ui/like-dislike-button';
import MediaPlayerModal from '@/app/ui/themes/MediaPlayer';
import { UpdateTheme, DeleteTheme } from '@/app/ui/themes/buttons';

interface MemberDetailClientProps {
  themes: ThemesTableWithLikes[];
  collaborations: CollaborationDisplayDataWithLikes[];
  memberName: string;
  memberId: string;
  currentUserId?: string;
}

const MemberDetailClient = ({ 
  themes, 
  collaborations, 
  memberName,
  memberId,
  currentUserId 
}: MemberDetailClientProps) => {
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
      <div className="w-full bg-gray-900 p-6 rounded-lg shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/members"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Members
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h1 className={`${lusitana.className} text-3xl text-white`}>
                {memberName}
              </h1>
              <p className="text-gray-400">
                {themes.length} themes • {collaborations.length} collaborations
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('themes')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'themes'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <MusicalNoteIcon className="w-4 h-4 inline mr-2" />
              Themes ({themes.length})
            </button>
            <button
              onClick={() => setActiveTab('collaborations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'collaborations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-2" />
              Collaborations ({collaborations.length})
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Original Themes</h2>
              {themes.length > 0 ? (
                <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-850">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Theme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {themes.map((theme) => (
                        <tr key={theme.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                  <MusicalNoteIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <Link
                                  href={`/dashboard/themes/${theme.id}`}
                                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                                >
                                  {theme.title}
                                </Link>
                                <p className="text-sm text-gray-400">{theme.instrument}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div>
                              <p>{theme.key} {theme.mode}</p>
                              <p className="text-gray-400">{theme.tempo} BPM</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              theme.status === 'complete'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {theme.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {formatDateToLocal(theme.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                              {/* Only show edit/delete buttons if current user owns the theme */}
                              {currentUserId === theme.member_id && (
                                <>
                                  <UpdateTheme id={theme.id} />
                                  <DeleteTheme id={theme.id} />
                                </>
                              )}
                              <Link
                                href={`/dashboard/themes/${theme.id}`}
                                className="text-indigo-400 hover:text-indigo-300"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-200">No themes yet</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    This member hasn&apos;t created any original themes yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'collaborations' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Collaborations</h2>
              {collaborations.length > 0 ? (
                <div className="overflow-hidden rounded-lg bg-gray-800 shadow">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-850">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Collaboration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Original Theme
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Added
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {collaborations.map((collab) => (
                        <tr key={collab.collab_id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                                  <UserGroupIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-green-400">
                                  {collab.collab_title} ({collab.collab_instrument})
                                </div>
                                <p className="text-xs text-gray-400">
                                  {collab.total_layers_count} layers total
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/dashboard/themes/${collab.parent_theme_id}`}
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              {collab.parent_theme_title}
                            </Link>
                            <p className="text-xs text-gray-400">
                              by {collab.parent_theme_creator_name}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex -space-x-2 overflow-hidden">
                              {collab.participants.slice(0, 3).map((participant) =>
                                participant.image_url && (
                                  <Image
                                    key={participant.id}
                                    src={participant.image_url}
                                    alt={participant.name}
                                    width={24}
                                    height={24}
                                    className="inline-block rounded-full ring-2 ring-gray-800"
                                    title={participant.name}
                                  />
                                )
                              )}
                              {collab.participants.length > 3 && (
                                <span className="text-xs text-gray-400 ml-2">
                                  +{collab.participants.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {formatTimestampToLocal(collab.collab_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                href={`/dashboard/collabs/${collab.collab_id}/add-layer`}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                title="Add a new layer to this collaboration"
                              >
                                <MicrophoneIcon className="w-3 h-3" />
                                Add Layer
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-200">No collaborations yet</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    This member hasn&apos;t participated in any collaborations yet.
                  </p>
                </div>
              )}
            </div>
          )}
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
};

export default MemberDetailClient;
