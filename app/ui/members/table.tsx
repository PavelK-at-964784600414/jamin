import Image from 'next/image';
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
                    <tr key={member.id} className="group">
                      <td className="whitespace-nowrap bg-gray-700 py-5 pl-4 pr-3 text-sm text-gray-200 group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Image
                            src={member.image_url}
                            className="rounded-full"
                            alt={`${member.user_name}'s profile picture`}
                            width={28}
                            height={28}
                          />
                          <p>{member.user_name}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm">
                        {member.instrument}
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm">
                        {member.themes_count}
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm">
                        {member.collabs_count}
                      </td>
                      <td className="whitespace-nowrap bg-gray-700 px-4 py-5 text-sm">
                        <h4 className="font-semibold">
                          {member.theme_name}
                        </h4>
                        <div className="text-gray-400">
                           {member.latest_theme_date}
                        </div>
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