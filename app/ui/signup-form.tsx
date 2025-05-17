"use client";

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { Button } from '@/app/ui/button';
import { register } from '@/app/lib/actions';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { SignupFormSchema } from '@/app/lib/definitions';

export default function SignupForm() {
  // Keep your existing hook unchanged
  const [errorMessage, formAction, isPending] = useActionState(register, undefined);

  // Local state for all input fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [instrument, setInstrument] = useState('');

  // Local state to store validation errors from Zod
  const [localErrors, setLocalErrors] = useState<{ [key: string]: string[] }>({});

  // Run validation on each change
  useEffect(() => {
    const formValues = {
      userName,
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      country,
      instrument,
    };

    const result = SignupFormSchema.safeParse(formValues);
    if (!result.success) {
      setLocalErrors(result.error.flatten().fieldErrors);
    } else {
      setLocalErrors({});
    }
  }, [userName, email, password, confirmPassword, firstName, lastName, country, instrument]);

  // Helper to get error messages for a field
  const getError = (field: string) =>
    localErrors[field] ? localErrors[field].join(', ') : null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="rounded-md bg-gray-800 p-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-white">
            First Name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('firstName') && (
            <p className="mt-1 text-sm text-red-500">{getError('firstName')}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-white">
            Last Name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('lastName') && (
            <p className="mt-1 text-sm text-red-500">{getError('lastName')}</p>
          )}
        </div>
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-white">
            User Name
          </label>
          <input
            id="userName"
            name="userName"
            type="text"
            placeholder="Enter your user name"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('userName') && (
            <p className="mt-1 text-sm text-red-500">{getError('userName')}</p>
          )}
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-white">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            placeholder="Enter your country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('country') && (
            <p className="mt-1 text-sm text-red-500">{getError('country')}</p>
          )}
        </div>
        <div>
          <label htmlFor="instrument" className="block text-sm font-medium text-white">
            Instrument
          </label>
          <input
            id="instrument"
            name="instrument"
            type="text"
            placeholder="Enter your instrument"
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('instrument') && (
            <p className="mt-1 text-sm text-red-500">{getError('instrument')}</p>
          )}
        </div>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('email') && (
            <p className="mt-1 text-sm text-red-500">{getError('email')}</p>
          )}
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('password') && (
            <div className="mt-1 text-sm text-red-500">
              <p>Password must:</p>
              <ul>
                {getError('password')?.split(', ').map((err) => (
                  <li key={err}>- {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 py-2 px-3 text-white placeholder-gray-400"
          />
          {getError('confirmPassword') && (
            <p className="mt-1 text-sm text-red-500">{getError('confirmPassword')}</p>
          )}
        </div>
        <Button type="submit" className="bg-primary text-white" disabled={isPending}>
          Sign Up
        </Button>
        {errorMessage && typeof errorMessage === 'string' && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-500">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </form>
  );
}