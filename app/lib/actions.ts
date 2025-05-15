'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signUp } from '@/auth';
import { AuthError } from 'next-auth';
import { uploadToS3 } from './s3';
import getServerSession from 'next-auth';
import { authConfig } from '@/auth.config';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({invalid_type_error: 'Please select a customer.',}),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {invalid_type_error: 'Please select an invoice status.',}),
  date: z.string(),
});
 
const UpdateTheme = FormSchema.omit({ id: true, date: true });


export type State = {
  errors?: {
    title?: string[];
    description?: string[];
    genre?: string[];
    key?: string[];
    tempo?: string[];
    audioFile?: string[];
  };
  message?: string | null;
  success?: boolean; // Add success flag for handling client-side navigation
};

const CreateTheme = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  genre: z.string().optional(),
  key: z.string().optional(),   // Previously “key”
  tempo: z.number().optional(),
  seconds: z.number().optional(),
  audioFile: z.any().optional(),           // Accept any input for audioFile
  instrument: z.string().optional(),
  scale: z.string().optional(), 
  mode: z.string().optional(),           
  chords: z.string().optional(),           // New: chord progression
});


export async function createTheme(prevState: State, formData: FormData) {
  
  // Get the current session from NextAuth
  const session = await getServerSession(authConfig);
  let memberId = session?.user?.id;
  console.log('session details:', session);
  if (!memberId) {
    console.warn('User not authenticated. Using default member id for testing.');
    memberId = 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa';
    //throw new Error('User not authenticated.');
  }

  try {
    const validatedFields = CreateTheme.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      genre: formData.get('genre'),
      key: formData.get('keySignature') ?? "",
      tempo: formData.get('tempo') ? Number(formData.get('tempo')) : undefined,
      audioFile: formData.get('audioFile'),
      instrument: formData.get('instrument'),
      scale: formData.get('scale') ?? "",
      mode: formData.get('mode') ?? "",
      chords: formData.get('chords'),
    });

    
    if (!validatedFields.success) {
      console.error('Validation failed:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or Invalid Fields. Failed to Create Theme.',
      };
    }

    const { title, description, genre, key, tempo, audioFile, instrument, scale, mode, chords } = validatedFields.data;
    let recording_url = null;
    const status = 'in progress';
    const seconds = 0;// need to get seconds fromrecording
      // Check if we have a file to upload
    if (audioFile) {
      try {
        // Check if it's a File object (client-side) or FormDataEntryValue (server-side)
        if (audioFile instanceof File) {
          const fileKey = `recordings/${Date.now()}-${audioFile.name}`;
          recording_url = await uploadToS3(audioFile, fileKey);
          console.log('File uploaded from File object, URL:', recording_url);
        } else if (audioFile instanceof Blob) {
          // Handle if it's a Blob
          const fileKey = `recordings/${Date.now()}-recording.webm`;
          recording_url = await uploadToS3(new File([audioFile], 'recording.webm', { type: 'audio/webm' }), fileKey);
          console.log('File uploaded from Blob, URL:', recording_url);
        } else {
          console.error('Invalid file object:', typeof audioFile, audioFile);
          throw new Error('Invalid file object provided');
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
        throw error;
      }
    }
    
    // If we still don't have a recording URL, throw an error - it's required
    if (!recording_url) {
      console.error('No recording_url after file upload attempt');
      return {
        errors: {
          audioFile: ['Audio file is required. Please record or upload an audio file.']
        },
        message: 'Audio file is required.',
      };
    }

    const date = new Date().toISOString().split('T')[0];

    // Use the memberId obtained from the session
    // member_id	seconds	key	mode	chords	tempo	date	status	description	title	genre	recording_url	instrument
    await sql`
      INSERT INTO themes (
        member_id,	seconds,	key,	mode,	chords,	tempo,	date,	status,	description,	title,	genre,	recording_url,	instrument
      ) VALUES (
        ${memberId}, ${seconds}, ${key}, ${mode}, ${chords}, ${tempo}, ${date}, ${status}, ${description}, ${title}, ${genre} , ${recording_url}, ${instrument}
      )
    `;
    console.log('Theme created successfully');
    revalidatePath('/dashboard/themes');
    
    // Redirect to the themes page after successful creation
    // This works with standard form submissions
    redirect('/dashboard/themes');
  } catch (error) {
    console.error('Error creating theme:', error);
    return {
      success: false,
      message: 'Database Error: Failed to Create Theme.',
    };
  }
}
 
export async function updateTheme(id: string, prevState: State, formData: FormData) {
  const validatedFields = CreateTheme.safeParse({
    customerId: formData.get('customerId'),
    seconds: formData.get('seconds'),
    status: formData.get('status'),
  });
  console.log(validatedFields);
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Theme.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, seconds, status } = validatedFields.data;

 try{
  await sql`
    UPDATE themes
    SET member_id = ${customerId}, seconds = ${seconds}, status = ${status}
    WHERE id = ${id}
  `;
} catch (error) {
  return {
    message: 'Database Error: Failed to Update Invoice.',
  };
}
  revalidatePath('/dashboard/themes');
  redirect('/dashboard/themes');
}

export async function deleteTheme(id: string) {
  throw new Error('Failed to Delete Invoice');
    try{
      await sql`DELETE FROM invoices WHERE id = ${id}`;
      revalidatePath('/dashboard/invoices');
    } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Use the signIn function imported from auth.ts which is an async wrapper
    const result = await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });
    
    // Check if authentication failed
    if (result?.error) {
      return 'Invalid credentials.';
    }
    
    // If we get here, authentication was successful
    console.log('Authentication successful - redirecting to dashboard');
    
    // Return success to clear any previous error state
    // The useEffect in the login form will handle the redirect
    return undefined;
  } catch (error) {
    console.error('Authentication error:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    return 'Something went wrong. Please try again.';
  }
}

export async function register(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signUp(undefined, formData);
    console.log('Registered successfully   ');
    redirect('/login');
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export type LayerState = {
  errors?: {
    title?: string[];
    description?: string[];
    instrument?: string[];
    audioFile?: string[];
    themeId?: string[];
  };
  message?: string | null;
  success?: boolean;
};

const CreateLayer = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  genre: z.string().optional(),
  keySignature: z.string().optional(),
  tempo: z.number().optional(),
  seconds: z.number().optional(),
  audioFile: z.any().optional(),
  instrument: z.string().nonempty(),
  scale: z.string().optional(),
  mode: z.string().optional(),
  chords: z.string().optional(),
  themeId: z.string().nonempty(),
});

export async function createLayer(prevState: LayerState | null, formData: FormData) {
  // Get the current session from NextAuth
  const session = await getServerSession(authConfig);
  let memberId = session?.user?.id;
  
  if (!memberId) {
    console.warn('User not authenticated. Using default member id for testing.');
    memberId = 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa';
  }

  try {
    const validatedFields = CreateLayer.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      genre: formData.get('genre'),
      keySignature: formData.get('keySignature') ?? "",
      tempo: formData.get('tempo') ? Number(formData.get('tempo')) : undefined,
      audioFile: formData.get('audioFile'),
      instrument: formData.get('instrument'),
      scale: formData.get('scale') ?? "",
      mode: formData.get('mode') ?? "",
      chords: formData.get('chords'),
      themeId: formData.get('themeId'),
    });
    
    if (!validatedFields.success) {
      console.error('Validation failed:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or Invalid Fields. Failed to Create Layer.',
      };
    }

    const { 
      title, description, genre, keySignature, tempo, 
      audioFile, instrument, scale, mode, chords, themeId 
    } = validatedFields.data;
    
    let recording_url = null;
    const status = 'complete'; // Layers are considered complete
    const seconds = 0; // We'll extract this from the recording
    
    if (audioFile instanceof File) {
      const fileKey = `layers/${Date.now()}-${audioFile.name}`;
      recording_url = await uploadToS3(audioFile, fileKey);
      console.log('Layer file uploaded, URL:', recording_url);
    } else {
      return {
        message: 'No audio file provided. Failed to Create Layer.',
      };
    }

    const date = new Date().toISOString().split('T')[0];

    // Insert the layer as a collaboration theme linked to the original theme
    await sql`
      INSERT INTO themes (
        member_id, seconds, key, mode, chords, tempo, date, status,
        description, title, genre, recording_url, instrument, parent_theme_id
      ) VALUES (
        ${memberId}, ${seconds}, ${keySignature}, ${mode}, ${chords}, 
        ${tempo}, ${date}, ${status}, ${description}, ${title}, 
        ${genre}, ${recording_url}, ${instrument}, ${themeId}
      )
    `;    console.log('Layer created successfully');
    revalidatePath(`/dashboard/themes/${themeId}`);
    
    // Redirect directly to the theme page
    redirect(`/dashboard/themes/${themeId}`);
  } catch (error) {
    console.error('Error creating layer:', error);
    return {
      message: 'Database Error: Failed to Create Layer.',
    };
  }
}

