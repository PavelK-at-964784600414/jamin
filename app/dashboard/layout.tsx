import SideNav from '@/app/ui/dashboard/sidenav';

//add the experimental_ppr segment config option to your dashboard layout
// related to: C:\Code\NextJS\Pavel_Portfolio\nextjs-dashboard\next.config.mjs file
export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}