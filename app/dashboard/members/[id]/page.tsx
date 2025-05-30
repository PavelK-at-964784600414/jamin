import { fetchThemesByMemberId, fetchCollaborationsByMemberId } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import MemberDetailClient from './MemberDetailClient';

export default async function MemberDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const memberId = resolvedParams.id;

  try {
    // Get current user session
    const session = await auth();
    const currentUserId = session?.user?.id;

    // Fetch member's themes and collaborations in parallel
    const [themes, collaborations] = await Promise.all([
      fetchThemesByMemberId(memberId),
      fetchCollaborationsByMemberId(memberId)
    ]);

    // Get member info from the first theme or collaboration
    const memberName = themes[0]?.user_name || collaborations[0]?.participants.find(p => p.id === memberId)?.name || 'Unknown Member';

    return (
      <MemberDetailClient 
        themes={themes}
        collaborations={collaborations}
        memberName={memberName}
        memberId={memberId}
        currentUserId={currentUserId}
      />
    );
  } catch (error) {
    console.error('Error fetching member data:', error);
    notFound();
  }
}
