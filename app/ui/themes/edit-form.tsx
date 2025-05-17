'use client';

import { MemberField, ThemeForm } from '@/app/lib/definitions';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateTheme } from '@/app/lib/actions';
import { useActionState } from 'react';

export default function EditThemeForm({
  theme,
  members,
}: {
  theme: ThemeForm;
  members: MemberField[];
}) {
  const updateThemeWithId = updateTheme.bind(null, theme.id);
  // Define the initial state matching the type expected by useActionState
  const initialState = { message: '', errors: {} };
  const [state, formAction] = useActionState(updateThemeWithId, initialState);
  
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={theme.id} />
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Title Field */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={theme.title}
            placeholder="Enter theme title"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.title && state.errors.title.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Description Field */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={theme.description || ''}
            placeholder="Enter theme description"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
            rows={3}
          />
          {state.errors?.description && state.errors.description.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Genre Field */}
        <div className="mb-4">
          <label htmlFor="genre" className="mb-2 block text-sm font-medium">
            Genre
          </label>
          <input
            id="genre"
            name="genre"
            defaultValue=""
            placeholder="Enter genre"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.genre && state.errors.genre.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Key Signature Field */}
        <div className="mb-4">
          <label htmlFor="keySignature" className="mb-2 block text-sm font-medium">
            Key Signature
          </label>
          <input
            id="keySignature"
            name="keySignature"
            defaultValue={theme.keySignature}
            placeholder="E.g. C, D, F#"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.key && state.errors.key.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Mode Field */}
        <div className="mb-4">
          <label htmlFor="mode" className="mb-2 block text-sm font-medium">
            Mode
          </label>
          <input
            id="mode"
            name="mode"
            defaultValue={theme.mode}
            placeholder="E.g. Major, Minor, Dorian"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.mode && state.errors.mode.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Chords Field */}
        <div className="mb-4">
          <label htmlFor="chords" className="mb-2 block text-sm font-medium">
            Chord Progression
          </label>
          <input
            id="chords"
            name="chords"
            defaultValue={theme.chords}
            placeholder="E.g. C-Am-F-G"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.chords && state.errors.chords.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Tempo Field */}
        <div className="mb-4">
          <label htmlFor="tempo" className="mb-2 block text-sm font-medium">
            Tempo (BPM)
          </label>
          <input
            id="tempo"
            name="tempo"
            type="number"
            defaultValue={theme.tempo}
            placeholder="E.g. 120"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.tempo && state.errors.tempo.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Instrument Field */}
        <div className="mb-4">
          <label htmlFor="instrument" className="mb-2 block text-sm font-medium">
            Instrument
          </label>
          <input
            id="instrument"
            name="instrument"
            defaultValue={theme.instrument}
            placeholder="E.g. Guitar, Piano, Drums"
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.instrument && state.errors.instrument.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>

        {/* Seconds Field */}
        <div className="mb-4">
          <label htmlFor="seconds" className="mb-2 block text-sm font-medium">
            Duration (seconds)
          </label>
          <input
            id="seconds"
            name="seconds"
            type="number"
            defaultValue={theme.seconds}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm"
          />
          {state.errors?.seconds && state.errors.seconds.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>{error}</p>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href={`/dashboard/themes/${theme.id}`}
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Update Theme</Button>
      </div>
    </form>
  );
}
