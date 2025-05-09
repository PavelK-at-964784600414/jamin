import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
  MusicalNoteIcon,
  RectangleStackIcon,
  
} from '@heroicons/react/24/outline';

import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';
import { CoolValueDisplay } from '@/app/ui/dashboard/cool-value-display';

const iconMap = {
  arangements: RectangleStackIcon,
  members: UserGroupIcon,
  pending: ClockIcon,
  themes: MusicalNoteIcon,
};

export default async function CardWrapper() {
  const { numberOfMembers, numberOfThemes, totalArangements, totalThemes } = await fetchCardData();

  return (
    <>
      {/* NOTE: Uncomment this code in Chapter 9 */}

      <Card title="Arangements" value={totalArangements} type="arangements" />
      <Card title="Pending" value={totalThemes} type="pending" />
      <Card title="Total Themes" value={numberOfThemes} type="themes" />
      <Card
        title="Total Members"
        value={numberOfMembers}
        type="members"
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'themes' | 'members' | 'pending' | 'arangements';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-black p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <CoolValueDisplay value={value} /> 
     </div>
  );
}
