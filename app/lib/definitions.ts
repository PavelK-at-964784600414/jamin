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
  parent_theme_id?: string; // Reference to parent theme for layers
  image_url?: string; // Added field for theme's image URL
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
  title: string; // Updated from 'name' to 'title'
  seconds: number;
};

export type ThemesTable = {
  id: string;
  seconds: number; 
  date: string;
  status: 'in progress' | 'complete';
  title: string; 
  chords: string;
  key: string; 
  mode: string;
  tempo: number;
  description: string;
  recording_url: string;
  user_name: string; // From members.user_name
  instrument: string;
  image_url: string; // From themes.image_url (Corrected comment)
  parent_theme_id?: string; 
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
  instrument: string;
  themes_count: number;
  collabs_count: number;
  theme_name: string;
  latest_theme_date: string;
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
  title: string;
  description?: string;
  seconds: number;
  keySignature: string;
  mode: string;
  chords: string;
  tempo: number;
  instrument: string;
  sample: string;
  date: string; 
  status: 'in progress' | 'complete';
  image_url?: string; // Added field for theme's image URL
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

  export const LoginFormSchema = z.
  object({
    email: z
      .string()
      .email({ message: 'Please enter a valid email.' })
      .trim(),
    password: z
      .string()
      .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
      .regex(/[0-9]/, { message: 'Contain at least one number.' })
      .regex(/[^a-zA-Z0-9]/, {
        message: 'Contain at least one special character.',
      })
      .trim(),
  });

export type LayerWithParentTheme = {
  layer_id: string;
  layer_title: string;
  layer_instrument: string;
  layer_date: string;
  layer_creator_name: string;
  layer_creator_image_url?: string; // Added for layer creator's image
  parent_theme_id: string;
  parent_theme_title: string;
  parent_theme_creator_name: string;
  parent_theme_creator_image_url?: string; // Added for parent theme creator's image
};

export type Participant = {
  id: string; // member_id
  name: string;
  image_url?: string;
};

export type EnrichedLayerWithParentTheme = {
  layer_id: string;
  layer_title: string;
  layer_instrument: string;
  layer_date: string; // Keep as string from DB, convert to Date object in JS if needed
  layer_recording_url?: string; // Add recording URL for play functionality
  layer_creator_id: string;
  layer_creator_name: string;
  layer_creator_image_url?: string;
  parent_theme_id: string;
  parent_theme_title: string;
  parent_theme_date: string; // Keep as string from DB
  parent_theme_recording_url?: string; // Add recording URL for the original theme
  parent_theme_creator_id: string;
  parent_theme_creator_name: string;
  parent_theme_creator_image_url?: string;
};

// Individual layer data within a collaboration
export type CollaborationLayer = {
  layer_id: string;
  layer_title: string;
  layer_instrument: string;
  layer_date: string;
  layer_creator_id: string;
  layer_creator_name: string;
  layer_creator_image_url?: string;
  layer_recording_url?: string;
};

export type CollaborationDisplayData = {
  collab_id: string; // The latest layer/collab ID (represents this collaboration state)
  collab_title: string; // The latest layer title
  collab_instrument: string; // The latest layer instrument
  collab_date: string; // When the latest layer was created
  collab_creator_id: string; // Who created the latest layer
  collab_creator_name: string; // Latest layer creator's name
  collab_creator_image_url?: string; // Latest layer creator's image
  collab_recording_url?: string; // The latest layer's recording URL
  parent_theme_id: string; // The original theme this collaboration is built on
  parent_theme_title: string; // The original theme title
  parent_theme_date: string; // When the original theme was created
  parent_theme_creator_id: string; // Who created the original theme
  parent_theme_creator_name: string; // Original theme creator's name
  parent_theme_creator_image_url?: string; // Original theme creator's image
  parent_theme_recording_url?: string; // Original theme's recording URL
  total_layers_count: number; // Total number of layers up to this point (including this collaboration)
  cumulative_layers: CollaborationLayer[]; // All layers that make up this collaboration (chronologically ordered)
  participants: Participant[]; // All participants in this cumulative collaboration
};

// For the table row itself, if we decide to make it a specific type
export type CollabTableRow = CollaborationDisplayData; // Alias for now

export type CollabRecord = {
  id: string; // layer's ID
  title: string;
  instrument: string;
  file_path: string; 
  parent_theme_id: string;
  member_id: string; // Layer creator's ID
  date: string; // Layer creation date (changed from created_at)
};

