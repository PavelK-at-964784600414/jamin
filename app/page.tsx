import AcmeLogo from "@/app/ui/jamin-logo"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import styles from "@/app/ui/home.module.css"
import { lusitana } from "@/app/ui/fonts"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-950 text-gray-100">
      <div className={styles.shape} />
      <div className="flex h-20 shrink-0 items-end rounded-lg bg-gradient-to-r from-violet-600 to-indigo-700 p-4 md:h-52 shadow-lg">
        {<AcmeLogo />}
      </div>
      <div className="mt-4 flex grow flex-col gap-4 md:flex-row">
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-900 px-6 py-10 md:w-2/5 md:px-20 border border-gray-800 shadow-xl">
          <div className="relative w-0 h-0 border-l-[15px] border-r-[15px] border-b-[26px] border-l-transparent border-r-transparent border-b-violet-500" />
          <p className={`${lusitana.className} text-xl md:text-3xl md:leading-normal text-gray-100`}>
            <strong>Welcome to our platform.</strong> Discover a modern experience designed for you.
          </p>
          <Link
            href="/login"
            className="flex items-center gap-5 self-start rounded-lg bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-105 md:text-base shadow-md"
          >
            <span>Log in</span> <ArrowRightIcon className="w-5 md:w-6" />
          </Link>
        </div>
        <div className="flex flex-col justify-center gap-6 rounded-lg bg-gray-900 p-6 md:w-3/5 md:p-16 border border-gray-800 shadow-xl">
          <div className="h-full w-full rounded-lg bg-gray-800 p-8 flex items-center justify-center">
            <p className="text-center text-gray-400">
              <span className="block text-2xl font-bold text-violet-400 mb-2">Modern Dark Interface</span>
              Your content will appear here. This sleek, dark-themed design enhances visibility and creates a premium
              experience.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

