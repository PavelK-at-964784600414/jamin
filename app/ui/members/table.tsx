import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import {
  CustomersTableType,
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
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Instument
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Creations
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Jams
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {members.map((member) => (
                    <tr key={member.id} className="group">
                      <td className="whitespace-nowrap bg-white py-5 pl-4 pr-3 text-sm text-black group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Image
                            src={member.image_url}
                            className="rounded-full"
                            alt={`${member.name}'s profile picture`}
                            width={28}
                            height={28}
                          />
                          <p>{member.name}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {/* {member.instument}  */}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {/* {member.creations} */}
                      </td>
                      <td className="whitespace-nowrap bg-white px-4 py-5 text-sm">
                        {/* {member.contribution} */}
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
