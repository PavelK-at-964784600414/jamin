'use client';

import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import JamInLogo from '@/app/ui/jamin-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
import { CoolSignOut } from '@/app/ui/dashboard/cool-sign-out';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <JamInLogo />
      <div className="hidden h-auto w-full grow rounded-md bg-black md:block">
        <NavLinks />
      </div>
      <div className="text-black md:flex-none md:justify-start md:p-2 md:px-3">
        <CoolSignOut />
      </div>
    </div>
  );
}