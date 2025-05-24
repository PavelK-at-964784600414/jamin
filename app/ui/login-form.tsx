"use client";

import { signIn } from 'next-auth/react';
import { FormEvent } from 'react';
import { Button } from '@/app/ui/button';
import { lusitana } from '@/app/ui/fonts';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

export default function LoginForm() {
  // Client-side signIn handler
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await signIn('credentials', {
      redirect: true,
      callbackUrl: '/dashboard',
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" className="mt-4 w-full">
          Log in
          <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
        </Button>
      </div>
      <div className="mt-4 flex flex-col items-center">
        <Button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-200 border border-gray-300"
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.3 2.7 30.54 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.2 5.6C43.98 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C.7 16.18 0 19.01 0 22c0 2.99.7 5.82 1.96 8.4l8.71-6.75z"/><path fill="#EA4335" d="M24 44c6.54 0 12.04-2.16 16.05-5.89l-7.2-5.6c-2.01 1.35-4.59 2.14-7.35 2.14-6.38 0-11.87-3.63-14.33-8.85l-8.71 6.75C6.73 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          Sign in with Google
        </Button>
      </div>
    </form>
  );
}