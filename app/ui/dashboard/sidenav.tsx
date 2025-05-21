import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import JamInLogo from '@/app/ui/jamin-logo';
import { PowerIcon } from '@heroicons/react/24/outline';
// Removed server-side signOut import; using `CoolSignOut` client component for logout
import { CoolSignOut } from '@/app/ui/dashboard/cool-sign-out'


export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
        <JamInLogo />
      <div className="hidden h-auto w-full grow rounded-md bg-black md:block bg-black">
        <NavLinks />
      </div>
      <div className="     text-black md:flex-none md:justify-start md:p-2 md:px-3">
          <CoolSignOut />
      </div>
    </div>
  );
}
/*
        <div className="hidden h-auto w-full grow rounded-md bg-black md:block bg-black"></div>
        <form action={async () => {
            'use server';
            await signOut();
          }}
        >
        <button className="flex h-[48px] w-full grow  items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-orange-400 bg-orange-600 hover:text-blue-400 text-black md:flex-none md:justify-start md:p-2 md:px-3">
            <PowerIcon className="w-6 text-black " />
            <div className="hidden md:block text-black">Sign Out</div>
          </button>
        </form>
      </div>
*/