'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn, signUp } from '@/auth';
import { AuthError } from 'next-auth';
import { uploadToS3 } from './s3';
import { authConfig } from '@/auth.config';
// We'll use dynamic import instead of static import for auth

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
  let session;
  try {
    // Dynamically import the auth function from auth-config.js
    const authModule = await import('@/auth-config.js');
    session = await authModule.auth();
    console.log('session details:', session);
  } catch (authError) {
    console.error('Auth import or execution failed:', authError);
    // Continue with fallback
  }
  
  let memberId = session?.user?.id;
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
    title: formData.get('title'),
    description: formData.get('description'),
    genre: formData.get('genre'),
    key: formData.get('keySignature') ?? "",
    tempo: formData.get('tempo') ? Number(formData.get('tempo')) : undefined,
    seconds: formData.get('seconds') ? Number(formData.get('seconds')) : 0,
    instrument: formData.get('instrument'),
    mode: formData.get('mode') ?? "",
    chords: formData.get('chords'),
  });
  
  console.log(validatedFields);
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Theme.',
    };
  }
  
  // Prepare data for insertion into the database
  const { title, description, genre, key, tempo, seconds, instrument, mode, chords } = validatedFields.data;

  try {
    await sql`
      UPDATE themes
      SET 
        title = ${title}, 
        description = ${description}, 
        genre = ${genre},
        key = ${key},
        tempo = ${tempo}, 
        seconds = ${seconds},
        instrument = ${instrument},
        mode = ${mode},
        chords = ${chords}
      WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Theme.',
    };
  }
  
  revalidatePath('/dashboard/themes');
  redirect('/dashboard/themes');
}

export async function deleteTheme(id: string) {
  try {
    await sql`DELETE FROM themes WHERE id = ${id}`;
    revalidatePath('/dashboard/themes');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete theme:', error);
    return {
      message: 'Database Error: Failed to Delete Theme.',
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
    if (result && 'error' in result) {
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
  themeId?: string; // Add themeId for client-side navigation
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

export async function createLayer(prevState: LayerState | null, formData: FormData) {  // Get the current session from NextAuth using dynamic import
  let session;
  try {
    // Dynamically import the auth function from auth-config.js
    // Import the entire module first to ensure it's loaded correctly
    const authModule = await import('@/auth-config.js');
    
    // Check if auth exists in the module and is a function
    if (typeof authModule.auth === 'function') {
      session = await authModule.auth();
      console.log('Auth session obtained through direct module access');
    } else {
      // If not found directly, try destructuring (in case of named exports)
      const { auth } = authModule;
      if (typeof auth === 'function') {
        session = await auth();
        console.log('Auth session obtained through destructured import');
      } else {
        console.error('Auth function not found in imported module');
      }
    }
  } catch (authError) {
    console.error('Auth import or execution failed:', authError);
    // Continue with fallback
  }
  
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
      if (audioFile) {
      try {        // Handle various types of file objects that could come from different browsers
        if (audioFile instanceof File) {
          // Standard File object - most common case
          try {
            // Always use the FileReader approach for better Safari compatibility
            // FileReader is safer for Safari than direct arrayBuffer() calls
            const safeFile = await new Promise<File>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const arrayBuffer = event.target?.result as ArrayBuffer;
                  if (!arrayBuffer) {
                    throw new Error('FileReader did not produce a result');
                  }
                  
                  // Create a completely new Blob to avoid Safari's readonly property issues
                  const fileBlob = new Blob([arrayBuffer], { type: audioFile.type || 'audio/webm' });
                  
                  // Create a completely new File from the original File's data
                  const safeFile = new File([fileBlob],
                    audioFile.name || `recording-${Date.now()}.webm`, 
                    { type: audioFile.type || 'audio/webm', lastModified: Date.now() }
                  );
                  
                  resolve(safeFile);
                } catch (error) {
                  reject(error);
                }
              };
              reader.onerror = () => reject(new Error('FileReader failed'));
              reader.readAsArrayBuffer(audioFile);
            });
              // Use our new safe file
            const fileKey = `layers/${Date.now()}-${safeFile.name}`;
            recording_url = await uploadToS3(safeFile, fileKey);
            console.log('Layer file uploaded using Safari-compatible approach, URL:', recording_url);
          } catch (error) {
            console.error('Error creating safe file:', error);
            throw error;
          }
        } else if (audioFile instanceof Blob) {
          // Handle Blob type (might come from some browser recordings)
          const fileKey = `layers/${Date.now()}-recording.webm`;
          const blobAsFile = new File([audioFile], 'recording.webm', { 
            type: audioFile.type || 'audio/webm',
            lastModified: Date.now() // Use current timestamp for Safari compatibility
          });
          recording_url = await uploadToS3(blobAsFile, fileKey);
          console.log('Layer file uploaded from Blob, URL:', recording_url);
        } else {
          // For other types, attempt to convert to a usable format
          try {
            const fileKey = `layers/${Date.now()}-recording.webm`;
            // Try to create a new Buffer and then a File from the unknown type
            const anyBlob = new Blob([audioFile], { type: 'audio/webm' });
            const safeFile = new File([anyBlob], 'recording.webm', { 
              type: 'audio/webm',
              lastModified: Date.now() // Use current timestamp for Safari compatibility
            });
            recording_url = await uploadToS3(safeFile, fileKey);
            console.log('Layer file uploaded from converted object, URL:', recording_url);
          } catch (conversionError) {
            console.error('Failed to convert audio file:', conversionError);
            return {
              message: 'Unsupported file format. Please try again with a different file.',
            };
          }
        }
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        return {
          message: 'Failed to upload audio file. Please try again.',
        };
      }
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
      )    `;    console.log('Layer created successfully');
    // Make sure themeId is a string before using it with revalidatePath
    const pathToRevalidate = `/dashboard/themes/${String(themeId)}`;
    revalidatePath(pathToRevalidate);
    
    // Return success instead of redirecting so client can handle navigation
    return {
      success: true,
      message: null,
      errors: {},
      themeId: String(themeId), // Include themeId for client-side navigation
    };
  } catch (error) {
    console.error('Error creating layer:', error);
    return {
      message: 'Database Error: Failed to Create Layer.',
      success: false,
    };
  }
}

