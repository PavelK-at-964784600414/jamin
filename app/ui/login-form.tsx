'use client';

import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { lusitana } from '@/app/ui/fonts';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { authenticate } from '@/app/lib/actions';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  
  // If authentication was successful (no error message) and not pending, redirect to dashboard
  useEffect(() => {
    if (!isPending && errorMessage === undefined) {
      console.log('Login successful, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [errorMessage, isPending, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-md bg-gray-800 p-6">
        <h1 className={`${lusitana.className} mb-3 text-2xl text-white text-center`}>
          Please log in to continue.
        </h1>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            required
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            minLength={4}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
        </div>
        <Button type="submit" className="mt-4 w-full" aria-disabled={isPending}>
          {isPending ? 'Signing in...' : 'Log in'} 
          {!isPending && <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />}
        </Button>
        {errorMessage && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-500">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </form>
  );
}