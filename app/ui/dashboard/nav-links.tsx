'use client';

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  MusicalNoteIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { CoolLink } from '@/app/ui/dashboard/cool-link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';


// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Themes', href: '/dashboard/themes', icon: DocumentDuplicateIcon },
  { name: 'Members', href: '/dashboard/members', icon: UserGroupIcon },
  { name: 'Collabs', href: '/dashboard/collabs', icon: MusicalNoteIcon },
  { name: 'Tools', href: '/dashboard/tools', icon: WrenchScrewdriverIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <CoolLink key={link.name} href={link.href} name={link.name} icon={link.icon} />

        );
      })}
    </>
  );
}
