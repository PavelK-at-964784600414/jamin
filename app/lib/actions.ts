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
    if (audioFile) {      try {
        // Check if it's a File object (client-side) or FormDataEntryValue (server-side)
        if (audioFile instanceof File) {
          const fileKey = `recordings/${Date.now()}-${audioFile.name}`;
          // Use the safe upload utility instead of direct uploadToS3
          const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
          recording_url = await uploadFileToS3WithRetry(audioFile, 'recordings');
          console.log('File uploaded from File object, URL:', recording_url);
        } else if (audioFile instanceof Blob) {
          // Handle if it's a Blob
          const fileKey = `recordings/${Date.now()}-recording.webm`;
          const blobFile = new File([audioFile], 'recording.webm', { type: 'audio/webm' });
          // Use the safe upload utility instead of direct uploadToS3
          const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
          recording_url = await uploadFileToS3WithRetry(blobFile, 'recordings');
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
    const status = 'complete'; // Layers are considered complete    const seconds = 0; // We'll extract this from the recording      
    if (audioFile) {
      try {
        // Handle various types of file objects that could come from different browsers
        if (audioFile instanceof File) {
          // For server-side file handling, avoid browser-only APIs
          try {
            // Create a file name if needed
            const fileName = audioFile.name || `recording-${Date.now()}.webm`;
            
            // Generate a unique key for S3
            const fileKey = `layers/${themeId}/${Date.now()}-${fileName}`;
            
            // Use the uploadFileToS3WithRetry utility which handles environment differences
            // This avoids direct FileReader usage on the server
            const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
            recording_url = await uploadFileToS3WithRetry(audioFile, 'layers/' + themeId);
            console.log('Layer file uploaded successfully to S3:', recording_url);
          } catch (error) {
            console.error('Error uploading file to S3:', error);
            return {
              message: 'Failed to upload audio file. Please try again.',
            };
          }
        } else if (audioFile instanceof Blob) {
          // Handle Blob type (might come from some browser recordings)
          try {
            const fileKey = `layers/${themeId}/${Date.now()}-recording.webm`;
            const blobAsFile = new File([audioFile], 'recording.webm', { 
              type: audioFile.type || 'audio/webm',
              lastModified: Date.now() 
            });
            // Use the uploadFileToS3WithRetry utility which handles environment differences
            const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
            recording_url = await uploadFileToS3WithRetry(blobAsFile, 'layers/' + themeId);
            console.log('Layer file uploaded from Blob, URL:', recording_url);
          } catch (error) {
            console.error('Error uploading Blob to S3:', error);
            return {
              message: 'Failed to upload audio blob. Please try again.',
            };
          }
        } else {
          // For other types, attempt to convert to a usable format
          try {
            const fileKey = `layers/${themeId}/${Date.now()}-recording.webm`;
            
            // Handle various data formats - ensure we have a usable object for S3
            let uploadableFile;
            
            if (typeof audioFile === 'string') {
              // If it's a data URL or string representation
              try {                // Try to create a Blob from base64 string if it looks like one
                if (audioFile.startsWith('data:')) {
                  const base64Data = audioFile.split(',')[1];
                  // Use Buffer instead of atob for server compatibility
                  const buffer = Buffer.from(base64Data, 'base64');
                  const byteArray = new Uint8Array(buffer);
                  
                  uploadableFile = new File([byteArray], 'recording.webm', { 
                    type: 'audio/webm',
                    lastModified: Date.now()
                  });
                } else {
                  // Handle plain text or URL strings
                  uploadableFile = new File([audioFile], 'recording.webm', { 
                    type: 'text/plain',
                    lastModified: Date.now()
                  });
                }
              } catch (parseError) {
                console.error('Error parsing string audio data:', parseError);
                return {
                  message: 'Invalid audio data format. Please try again with a proper audio file.',
                };
              }
            } else if (Buffer.isBuffer(audioFile)) {
              // Handle Node.js Buffer type
              uploadableFile = new File([audioFile], 'recording.webm', { 
                type: 'audio/webm',
                lastModified: Date.now()
              });
            } else if (ArrayBuffer.isView(audioFile) || audioFile instanceof ArrayBuffer) {
              // Handle ArrayBuffer or TypedArray
              uploadableFile = new File([audioFile], 'recording.webm', { 
                type: 'audio/webm',
                lastModified: Date.now()
              });
            } else {
              // Last resort - try to convert unknown type to a blob
              try {
                const anyBlob = new Blob([audioFile], { type: 'audio/webm' });
                uploadableFile = new File([anyBlob], 'recording.webm', { 
                  type: 'audio/webm',
                  lastModified: Date.now()
                });
              } catch (blobError) {
                console.error('Failed to create blob from unknown type:', blobError);
                return {
                  message: 'Unsupported file format. Please try again with a different file.',
                };
              }
            }            
            // Upload the converted file using the utility function that's safe for server-side
            const { uploadFileToS3WithRetry } = await import('@/app/lib/upload-utils');
            recording_url = await uploadFileToS3WithRetry(uploadableFile, 'layers/' + themeId);
            console.log('Layer file uploaded from converted format, URL:', recording_url);
          } catch (conversionError) {
            console.error('Failed to convert or upload audio file:', conversionError);
            return {
              message: 'Unsupported file format. Please try again with a different file.',
            };
          }
        }
      } catch (uploadError) {
        console.error('Error in file upload process:', uploadError);
        return {
          message: 'Failed to process audio file. Please try again.',
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

