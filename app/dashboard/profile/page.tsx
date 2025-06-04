import { Suspense } from 'react';
import { fetchThemesByMemberId, fetchCollaborationsByMemberId } from '@/app/lib/data';
import { auth } from '@/auth';
import { lusitana } from '@/app/ui/fonts';
import { notFound } from 'next/navigation';
import UserProfileClient from './UserProfileClient';
import Image from 'next/image';
import { logger } from '@/app/lib/logger';

export default async function UserProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    notFound();
  }

  const userId = session.user.id;
  const userName = session.user.name || 'User';
  const userImage = session.user.image || '/members/user.png';

  try {
    const [userThemes, userCollaborations] = await Promise.all([
      fetchThemesByMemberId(userId),
      fetchCollaborationsByMemberId(userId)
    ]);

    return (
      <main>
        <div className="flex items-center mb-6">
          <Image
            src={userImage}
            alt={`${userName}'s profile picture`}
            width={64}
            height={64}
            className="rounded-full mr-4"
          />
          <div>
            <h1 className={`${lusitana.className} text-2xl md:text-3xl text-white`}>
              {userName}&apos;s Profile
            </h1>
            <p className="text-gray-400">Your musical journey</p>
          </div>
        </div>

        <UserProfileClient 
          themes={userThemes}
          collaborations={userCollaborations}
          userName={userName}
        />
      </main>
    );
  } catch (error) {
    logger.error('Error loading user profile', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    return (
      <main>
        <h1 className={`${lusitana.className} text-2xl md:text-3xl text-white mb-6`}>
          Profile
        </h1>
        <div className="text-center text-gray-400">
          <p>Unable to load profile data.</p>
        </div>
      </main>
    );
  }
}
