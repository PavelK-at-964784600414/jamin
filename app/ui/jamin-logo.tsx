import { SparklesIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function JaminLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-green`}
    >
      <SparklesIcon className="h-12 w-120 rotate-[15deg]" />
      <p className="text-[44px]">JamIn</p>
    </div>
  );
}
