import { z } from 'zod'


// Member related types
export type Member = {
  id: string;
  user_name: string;
  email: string;
  password: string;
  image_url: string;
  details: AdditionalDetails | null;
  themes: Theme[] | null;
};

export type AdditionalDetails = {
  first_name: string;
  last_name: string;
  country: string | null;
  instrument: string | null;
};

// Theme types – updated with new field names and types
export type Theme = {
  id: string;
  member_id: string;
  title: string;
  description?: string;
  seconds: number;
  keySignature: string;
  mode: string;
  chords: string;
  tempo: number;
  recording_url: string;
  instrument: string;
  date: string;
  status: 'in progress' | 'complete';
};

// New type for signup data
export type SignupData = {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  password: string;
};

// Other Theme-related types
export type LatestThemes = {
  id: string;
  title: string;
  image_url: string;
  user_name: string;
  date: string;
};

export type ThemePages = {
  title: string;
  status: string;
  user_name: string;
  seconds: string;
};

export type LatestThemesRaw = Omit<LatestThemes, 'title'> & {
  name: string;
  seconds: number;
};

export type ThemesTable = {
  seconds: string;
  id: string;
  user_name: string;
  title: string;
  chords: string;
  key: string;
  mode: string;
  tempo: string;
  instrument: string;
  image_url: string;
  date: string;
  status: 'in progress' | 'complete';
  recording_url: string;
};

// Member table related types
export type MembersTableType = {
  id: string;
  title: string;
  email: string;
  image_url: string;
  total_themes: number;
  total_in_progress: number;
  total_complete: number;
};

export type FormattedMembersTable = {
  id: string;
  user_name: string;
  image_url: string;
  instrument: number;
  themes: string;
};

export type MemberField = {
  id: string;
  user_name: string;
  image_url: string;
};

// Theme form related types – updated to use keySignature and chords as string
export type ThemeForm = {
  id: string;
  user_name: string;
  name: string;
  description?: string;
  seconds: number;
  keySignature: string;
  mode: string;
  chords: string;
  tempo: number;
  instrument: string;
  sample: string;
  date: Date;
  status: 'in progress' | 'complete';
};

export type FormState =
  | {
      errors?: {
        userName?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined

// Zod schemas for validation
  export const SignupFormSchema = z
  .object({
    userName: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long.' })
      .trim(),
    email: z
      .string()
      .email({ message: 'Please enter a valid email.' })
      .trim(),
    password: z
      .string()
      .min(8, { message: 'Be at least 8 characters long' })
      .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
      .regex(/[0-9]/, { message: 'Contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Contain at least one special character.',
      })
      .trim(),
    confirmPassword: z.string().trim(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    country: z.string().trim().optional(),
    instrument: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
    
  });