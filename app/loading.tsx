import { lusitana } from '@/app/ui/fonts'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mb-4"></div>
        <h2 className={`${lusitana.className} text-xl text-gray-300`}>
          Loading...
        </h2>
      </div>
    </div>
  )
}
