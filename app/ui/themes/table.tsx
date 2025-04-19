import Image from 'next/image';
import { UpdateTheme, DeleteTheme } from '@/app/ui/themes/buttons';
import ThemeStatus from '@/app/ui/themes/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { fetchFilteredThemes } from '@/app/lib/data';

export default async function ThemesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const themes = await fetchFilteredThemes(query, currentPage);
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">
                  Title
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Lenght
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Details
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {themes?.map((theme) => (
                <tr
                  key={theme.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={theme.image_url}
                        className="rounded-full"
                        width={28}
                        height={28}
                        alt={`${theme.name}'s profile picture`}
                      />
                      <p>{theme.title}</p>
                    </div>
                  </td>
                 
                  <td className="whitespace-nowrap px-3 py-3">
                  {Math.floor(theme.seconds / 60)}:{(theme.seconds % 60).toString().padStart(2, '0')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(theme.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <h2>Chords:       <b>{theme.chords}</b></h2>
                    <h2>Key:          <b>{theme.key}</b></h2>
                    <h2>Mode:         <b>{theme.mode}</b></h2>
                    <h2>Tempo:        <b>{theme.tempo}</b></h2>
                    <h2>Description:  <b>{theme.description}</b></h2>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateTheme id={theme.id} />
                      <DeleteTheme id={theme.id} />
                    </div>
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
