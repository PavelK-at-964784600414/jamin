'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { Member} from '@/app/lib/definitions';
import { FormState, SignupFormSchema, LoginFormSchema } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
 
async function getMember(email: string): Promise<Member | undefined> {
  try {
    const user = await sql<Member>`SELECT * FROM members WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

async function insertMember(
  userName: string,
  email: string,
  password: string,
  firstName: string | null,
  lastName: string | null,
  country: string | null,
  instrument: string | null,
): Promise<Member | undefined> {
  // Generate a unique ID for the new member
  const id = crypto.randomUUID();
  const image_url = '/members/evil-rabbit.png';
  
  try {
    const { rows } = await sql<Member>`INSERT INTO members (id, user_name, email, password, image_url, first_name, last_name, country, instrument)
        VALUES (${id}, ${userName}, ${email}, ${password}, ${image_url}, ${firstName}, ${lastName}, ${country}, ${instrument}) RETURNING *`;
    return rows[0];
  } catch (error) {
    console.error('Failed to insert user:', error);
    throw new Error('Failed to insert user.');
  }
}

export async function signUp(state: FormState, formData: FormData) {
  
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    userName: formData.get('userName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    country: formData.get('country'),
    instrument: formData.get('instrument'),
  })
  
  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten(),
    }
  }
  // Prepare data for insertion into database
  const { userName, email, password, firstName, lastName, country, instrument} = validatedFields.data
  // Hash the user's password before storing it
  const hashedPassword = await bcrypt.hash(password, 10)
 
  // Insert the user into the database
  const data = await insertMember(userName, email, hashedPassword, firstName, lastName, country, instrument)
  
  if (data) {
    return data
  } else {
    return {
      message: 'Failed to create user. Please try again.',
    }
  }
}

// Create an async wrapper for the signIn function
export async function signIn(provider: string, options?: any) {
  const { signIn: nextAuthSignIn } = await import('./auth-config');
  return nextAuthSignIn(provider, options);
}

// Create a server action for signOut
export async function signOut(options?: { redirect?: boolean; redirectTo?: string }) {
  const { signOut: nextAuthSignOut } = await import('./auth-config');
  return nextAuthSignOut(options);
}
