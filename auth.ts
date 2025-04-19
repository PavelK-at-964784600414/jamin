'use server'

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { Member} from '@/app/lib/definitions';
import { FormState, SignupFormSchema } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
 
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
 
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
 
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getMember(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
 
          if (passwordsMatch) return user;
        }
 
        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});


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
  // e.g. Hash the user's password before storing it
  const hashedPassword = await bcrypt.hash(password, 10)
 
  // 3. Insert the user into the database or call an Auth Library's API
  const data = await insertMember(userName, email, hashedPassword, firstName, lastName, country, instrument)
 
}

