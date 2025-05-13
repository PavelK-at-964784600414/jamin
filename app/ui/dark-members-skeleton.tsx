'use client';

// Loading animation
const shimmer =
  'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-gray-600/30 before:to-transparent';

export function DarkMembersTableSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-lg bg-gray-800 p-2 md:pt-0">
          <div className="md:hidden">
            {/* Mobile view skeletons */}
            <div className={`${shimmer} relative mb-4 h-20 overflow-hidden rounded-md bg-gray-700 p-4`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-600"></div>
                <div className="h-6 w-24 rounded bg-gray-600"></div>
              </div>
              <div className="mt-2 h-4 w-32 rounded bg-gray-600"></div>
            </div>
            <div className={`${shimmer} relative mb-4 h-20 overflow-hidden rounded-md bg-gray-700 p-4`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-600"></div>
                <div className="h-6 w-24 rounded bg-gray-600"></div>
              </div>
              <div className="mt-2 h-4 w-32 rounded bg-gray-600"></div>
            </div>
            <div className={`${shimmer} relative mb-4 h-20 overflow-hidden rounded-md bg-gray-700 p-4`}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-600"></div>
                <div className="h-6 w-24 rounded bg-gray-600"></div>
              </div>
              <div className="mt-2 h-4 w-32 rounded bg-gray-600"></div>
            </div>
          </div>
          
          {/* Desktop view skeleton */}
          <table className="hidden min-w-full text-gray-200 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  <div className="h-6 w-24 rounded bg-gray-600"></div>
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <div className="h-6 w-24 rounded bg-gray-600"></div>
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <div className="h-6 w-16 rounded bg-gray-600"></div>
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <div className="h-6 w-16 rounded bg-gray-600"></div>
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <div className="h-6 w-24 rounded bg-gray-600"></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="w-full">
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-600"></div>
                      <div className="h-6 w-24 rounded bg-gray-600"></div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-24 rounded bg-gray-600"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-16 rounded bg-gray-600"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-6 w-16 rounded bg-gray-600"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-10 w-24 rounded bg-gray-600"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
