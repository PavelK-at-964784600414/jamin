import Image from 'next/image';
import Link from 'next/link';
import {
  FormattedMembersTable,
} from '@/app/lib/definitions';

export default async function MembersTable({
  members,
}: {
  members: FormattedMembersTable[];
}) {
  return (
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-800 p-2 md:pt-0">
              <table className="hidden min-w-full rounded-md text-gray-200 md:table">
                <thead className="rounded-md bg-gray-800 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Instrument
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Themes
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Collabs
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Latest Theme
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="group hover:bg-gray-750 transition-colors cursor-pointer">
                      <td className="whitespace-nowrap bg-gray-700 py-5 pl-4 pr-3 text-sm text-gray-200 group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6 group-hover:bg-gray-750">
                        <Link href={`/dashboard/members/${member.id}`} className="flex items-center gap-3 w-full">
                          <Image
                            src={member.image_url}
                            className="rounded-full"
                            alt={`${member.user_name}'s profile picture`}
                            width={28}
                            height={28}
                          />
                          <p className="group-hover:text-blue-300 transition-colors">{member.user_name}</p>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm group-hover:bg-gray-750">
                        <Link href={`/dashboard/members/${member.id}`} className="block w-full h-full">
                          {member.instrument}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm group-hover:bg-gray-750">
                        <Link href={`/dashboard/members/${member.id}`} className="block w-full h-full">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {member.themes_count}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm group-hover:bg-gray-750">
                        <Link href={`/dashboard/members/${member.id}`} className="block w-full h-full">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {member.collabs_count}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm group-hover:bg-gray-750">
                        <Link href={`/dashboard/members/${member.id}`} className="block w-full h-full">
                          <h4 className="font-semibold group-hover:text-blue-300 transition-colors">
                            {member.theme_name}
                          </h4>
                          <div className="text-gray-400">
                             {member.latest_theme_date}
                          </div>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}