"use client";

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import { register, type RegisterState } from '@/app/lib/actions';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { SignupFormSchema } from '@/app/lib/definitions';
import confetti from 'canvas-confetti';

export default function SignupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<RegisterState | undefined, FormData>(
    register, 
    undefined
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFormAction = async (formData: FormData) => {
    return formAction(formData);
  };

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

  // Handle success with confetti and redirect
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Redirect after showing success message for 2 seconds
      const redirectTimer = setTimeout(() => {
        router.push('/login');
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [state, router]);

  // Helper to get error messages for a field
  const getError = (field: string) =>
    localErrors[field] ? localErrors[field].join(', ') : null;

  return (
    <>
      {/* Success Message with Confetti */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-r from-green-800 to-green-600 text-white rounded-xl p-8 shadow-2xl border border-green-400 max-w-md mx-4 transform scale-100 animate-pulse">
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-20 h-20 text-green-200 mx-auto animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">🎉 Account Created!</h2>
              <p className="text-green-100 mb-4 text-lg">Your account has been successfully created.</p>
              <p className="text-green-300 text-sm font-medium">Redirecting to login page in 2 seconds...</p>
              <div className="mt-4 w-full bg-green-700 rounded-full h-2">
                <div className="bg-green-300 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <form action={handleFormAction} className="space-y-4">
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
        <Button type="submit" className="bg-primary text-white" disabled={isPending || showSuccess}>
          {isPending ? 'Creating Account...' : 'Sign Up'}
        </Button>
        {state?.error && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-500">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span>{state.error}</span>
          </div>
        )}
      </div>
    </form>
    </>
  );
}