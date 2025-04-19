"use client";
import Image from 'next/image';
import { useState } from 'react';
import { UpdateTheme, DeleteTheme } from '@/app/ui/themes/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import type { ThemesTable as ThemeItem } from '@/app/lib/definitions';

export default function ThemesTableClient({ themes }: { themes: ThemeItem[] }) {
  const [selected, setSelected] = useState<ThemeItem | null>(null);

  return (
    <>
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
            <table className="min-w-full text-gray-900 table-auto">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th className="px-3 py-5 font-medium">Title</th>
                  <th className="px-3 py-5 font-medium">Length</th>
                  <th className="px-3 py-5 font-medium">Date</th>
                  <th className="px-3 py-5 font-medium">Details</th>
                  <th className="relative py-3 pl-6 pr-3"><span className="sr-only">Edit</span></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {themes.map(theme => (
                  <tr
                    key={theme.id}
                    onClick={() => setSelected(theme)}
                    className="cursor-pointer w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={theme.image_url}
                          width={28}
                          height={28}
                          className="rounded-full"
                          alt={`${theme.title} cover`}
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
                      <h2>Chords: <b>{theme.chords}</b></h2>
                      <h2>Key: <b>{theme.key}</b></h2>
                      <h2>Mode: <b>{theme.mode}</b></h2>
                      <h2>Tempo: <b>{theme.tempo}</b></h2>
                      {theme.description && <h2>Description: <b>{theme.description}</b></h2>}
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

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <button
              className="mb-4 text-sm text-gray-600 hover:text-gray-900"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <h2 className="text-lg font-medium mb-2">{selected.title}</h2>
            {/\.(mp4|webm|ogg)$/i.test(selected.recording_url) ? (
              <video
                src={selected.recording_url}
                controls
                autoPlay
                className="w-full max-h-[80vh]"
              />
            ) : (
              <audio
                src={selected.recording_url}
                controls
                autoPlay
                className="w-full"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}