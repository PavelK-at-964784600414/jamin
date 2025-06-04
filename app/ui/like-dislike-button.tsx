'use client';

import { useState, useTransition } from 'react';
import { HeartIcon as HeartIconOutline, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { LikeStats, LikeType } from '@/app/lib/definitions';
import { toggleThemeLike, toggleCollabLike } from '@/app/lib/actions';
import { useSession } from 'next-auth/react';
import { logger } from '@/app/lib/logger';

interface LikeDislikeButtonProps {
  itemId: string;
  itemType: 'theme' | 'collaboration';
  likeStats: LikeStats;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeDislikeButton({
  itemId,
  itemType,
  likeStats,
  className = '',
  size = 'md',
}: LikeDislikeButtonProps) {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(likeStats);
  const [isPending, startTransition] = useTransition();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Don't render until we know the session status
  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-800">
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
        </div>
      </div>
    );
  }

  const handleLikeAction = async (action: LikeType) => {
    if (!session?.user?.id) {
      // Could show a toast or redirect to login
      return;
    }

    startTransition(async () => {
      try {
        const result = itemType === 'theme' 
          ? await toggleThemeLike(itemId, action)
          : await toggleCollabLike(itemId, action);

        if (result.success && result.like_stats) {
          setStats(result.like_stats);
        }
      } catch (error) {
        logger.error('Error toggling like', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      }
    });
  };

  const isLiked = stats.userLike === 'like';
  const isDisliked = stats.userLike === 'dislike';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Like Button */}
      <button
        onClick={() => handleLikeAction('like')}
        disabled={isPending || !session?.user?.id}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors duration-200 ${
          isLiked
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400'
        } ${!session?.user?.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={session?.user?.id ? (isLiked ? 'Remove like' : 'Like') : 'Sign in to like'}
      >
        {isLiked ? (
          <HeartIconSolid className={`${sizeClasses[size]} text-red-500`} />
        ) : (
          <HeartIconOutline className={sizeClasses[size]} />
        )}
        <span className={`font-medium ${textSizeClasses[size]}`}>
          {stats.likes}
        </span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleLikeAction('dislike')}
        disabled={isPending || !session?.user?.id}
        className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors duration-200 ${
          isDisliked
            ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
        } ${!session?.user?.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
        title={session?.user?.id ? (isDisliked ? 'Remove dislike' : 'Dislike') : 'Sign in to dislike'}
      >
        <XMarkIcon className={sizeClasses[size]} />
        <span className={`font-medium ${textSizeClasses[size]}`}>
          {stats.dislikes}
        </span>
      </button>

      {isPending && (
        <div className="flex items-center">
          <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`}></div>
        </div>
      )}
    </div>
  );
}
