import SideNav from '@/app/ui/dashboard/sidenav';
import { auth } from '@/auth'; // Import auth
import Image from 'next/image'; // Import Image
import { lusitana } from '@/app/ui/fonts'; // Import lusitana font

//add the experimental_ppr segment config option to your dashboard layout
// related to: C:\Code\NextJS\Pavel_Portfolio\nextjs-dashboard\next.config.mjs file
export const experimental_ppr = true;

export default async function Layout({ children }: { children: React.ReactNode }) { // Make Layout async
  const session = await auth();
  const userName = session?.user?.name || 'User';
  const userImage = session?.user?.image || '/members/user.png';

  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
        {/* Welcome message and Dashboard Title section */}
        <div className="flex justify-between items-center mb-4">
          {/* This h1 will be dynamic based on the page, or you might want a generic one */}
          {/* For now, let's remove the static "Dashboard" title from here */}
          {/* <h1 className={`${lusitana.className} text-xl md:text-2xl`}>Dashboard</h1> */}
          <div></div> {/* Empty div to push welcome message to the right if no title is present */}
          <div className="flex items-center">
            <Image
              src={userImage}
              alt={`${userName}'s profile picture`}
              width={32}
              height={32}
              className="rounded-full mr-2"
            />
            <h2 className={`${lusitana.className} text-lg md:text-xl font-normal`}>
              Welcome, {userName}!
            </h2>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}