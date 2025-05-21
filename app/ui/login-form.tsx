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
    </form>
  );
}