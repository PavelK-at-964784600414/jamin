'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signUp, signOut } from '@/auth';
import { uploadToS3 } from './s3';

// Helper function to check if an error is an auth error
function isAuthError(error: unknown): error is { type: string } {
  return (
    typeof error === 'object' && 
    error !== null && 
    'type' in error &&
    typeof (error as any).type === 'string'
  );
}

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
  message: string | null;
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
    session = await auth();
    console.log('session details:', session);
  } catch (authError) {
    console.error('Auth execution failed:', authError);
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
        success: false,
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
        success: false,
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
    // Always return a State object for useActionState compatibility
    return { message: null, errors: {}, success: true };
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

// Server action to authenticate and redirect to dashboard
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  'use server';
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    // Use signIn with redirect to handle the authentication properly
    await signIn('credentials', { 
      email, 
      password, 
      redirectTo: '/dashboard'
    });
    
    // If we reach here, authentication was successful
    return undefined;
  } catch (error) {
    // Handle authentication errors
    if (isAuthError(error)) {
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

export async function register(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Extract signup fields from formData
    const userName = formData.get('userName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = (formData.get('firstName') as string) || null;
    const lastName = (formData.get('lastName') as string) || null;
    const country = (formData.get('country') as string) || null;
    const instrument = (formData.get('instrument') as string) || null;

    // Call signUp helper
    await signUp(userName, email, password, firstName, lastName, country, instrument);
    // Success: let client handle redirect
    return undefined;
  } catch (error) {
    console.error('Registration error:', error);
    return 'Something went wrong. Please try again.';
  }
}

// Add logout action
export async function logoutAction() {
  // Call NextAuth signOut server action and redirect
  await signOut();
  redirect('/login');
}

// Google sign-in server action
export async function googleSignIn() {
  'use server';
  await signIn('google', { callbackUrl: '/dashboard' });
}

export type LayerState = {
  errors?: {
    title?: string[];
    description?: string[];
    instrument?: string[];
    audioFile?: string[];
    themeId?: string[];
    collaborationId?: string[];
  };
  message?: string | null;
  success?: boolean;
  themeId?: string | null; // Allow null values for client-side navigation
};

const CreateLayer = z.object({
  title: z.string().nonempty(),
  description: z.string().optional(),
  genre: z.string().optional(),
  keySignature: z.string().optional(),
  tempo: z.number().optional(),
  seconds: z.number().optional(),
  audioFile: z.any().optional(),
  instrument: z.string().min(1, "Instrument is required"), // More specific error message
  scale: z.string().optional(),
  mode: z.string().optional(),
  chords: z.string().optional(),
  themeId: z.string().optional().nullable(), // Allow null values
  collaborationId: z.string().optional().nullable(), // Allow null values
}).refine(data => data.themeId || data.collaborationId, {
  message: "Either themeId or collaborationId must be provided",
});

export async function createLayer(prevState: LayerState | null, formData: FormData) {  // Get the current session from NextAuth using dynamic import
  let session;
  try {
    session = await auth();
    console.log('session details:', session);
  } catch (authError) {
    console.error('Auth execution failed:', authError);
  }
  
  let memberId = session?.user?.id;
  
  if (!memberId) {
    console.warn('User not authenticated. Using default member id for testing.');
    memberId = 'd6e15727-9fe1-4961-8c5b-ea44a9bd81aa';
  }
  const themeId = formData.get('themeId') as string | null;
  const collaborationId = formData.get('collaborationId') as string | null;

  if (!themeId && !collaborationId) {
    return {
      message: 'Either theme ID or collaboration ID is required.',
      success: false,
      errors: { themeId: ['Theme ID or collaboration ID is required.'] },
    };
  }

  // Import data fetching functions
  const { fetchThemeById, fetchLayersByThemeId, fetchCollaborationById } = await import('./data');

  try {    let parentData: any;
    let existingLayers: any[];
    let layerNumber: number;
    let newLayerTitle: string;
    let parentThemeId: string;
    let mixingAudioUrl: string | undefined = undefined;    if (collaborationId) {
      // We're adding a layer to an existing collaboration
      console.log('Adding layer to collaboration:', collaborationId);
      
      const collaboration = await fetchCollaborationById(collaborationId);
      if (!collaboration) {
        return { message: 'Collaboration not found.', success: false, themeId: collaborationId };
      }

      parentData = collaboration;
      parentThemeId = collaboration.parent_theme_id;
      
      // Get existing layers for this theme to calculate layer number
      existingLayers = await fetchLayersByThemeId(parentThemeId);
      layerNumber = existingLayers.length + 1;
      
      // Use the collaboration's complete recording for mixing
      mixingAudioUrl = collaboration.collab_recording_url;
      
      const instrumentForTitle = formData.get('instrument') as string || 'Instrument';
      newLayerTitle = `${collaboration.parent_theme_title} - Layer ${layerNumber} (${instrumentForTitle})`;
    } else if (themeId) {
      // We're adding the first layer to a theme (original behavior)
      console.log('Adding first layer to theme:', themeId);
      
      const [parentThemeData, themeLayers] = await Promise.all([
        fetchThemeById(themeId),
        fetchLayersByThemeId(themeId)
      ]);

      if (!parentThemeData) {
        return { message: 'Parent theme not found.', success: false, themeId };
      }

      if (themeLayers.length >= 5) {
        return { message: 'Maximum of 5 layers per theme reached.', success: false, themeId };
      }

      parentData = parentThemeData;
      existingLayers = themeLayers;
      parentThemeId = themeId;
      layerNumber = existingLayers.length + 1;
      
      // Use the theme's sample for mixing
      mixingAudioUrl = parentThemeData.sample;
      
      const instrumentForTitle = formData.get('instrument') as string || 'Instrument';
      newLayerTitle = `${parentThemeData.title} - Layer ${layerNumber} (${instrumentForTitle})`;
    } else {
      return {
        message: 'Either theme ID or collaboration ID is required.',
        success: false,
        errors: { themeId: ['Theme ID or collaboration ID is required.'] },
      };
    }    const validatedFields = CreateLayer.safeParse({
      title: newLayerTitle,
      description: formData.get('description'),
      genre: formData.get('genre'),
      keySignature: formData.get('keySignature') ?? "",
      tempo: formData.get('tempo') ? Number(formData.get('tempo')) : undefined,
      audioFile: formData.get('audioFile'),
      instrument: formData.get('instrument'),
      scale: formData.get('scale') ?? "",
      mode: formData.get('mode') ?? "",
      chords: formData.get('chords'),
      themeId: themeId,
      collaborationId: collaborationId,
    });
    
    if (!validatedFields.success) {
      console.error('Validation failed:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or Invalid Fields. Failed to Create Layer.',
        themeId,
      };
    }    const { 
      title, description, genre, keySignature, tempo, 
      audioFile, instrument, scale, mode, chords // themeId is already defined
    } = validatedFields.data;
    
    // Debug: Log audioFile details
    console.log('audioFile received:', {
      audioFile,
      type: typeof audioFile,
      constructor: audioFile?.constructor?.name,
      size: audioFile?.size,
      name: audioFile?.name,
      type_property: audioFile?.type
    });
    
    let recording_url = null;
    const status = 'complete'; // Layers are considered complete
    const seconds = 0; // We'll extract this from the recording      
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
    }    // After uploading both layer recording and retrieving parent/collaboration data, mix the two audio files
    if (recording_url && mixingAudioUrl) {
      // Use a server-side ffmpeg utility to mix the base audio (theme or collaboration) with new layer audio
      const { mixAudioFiles } = await import('./audio-mix-server');
      const mixedUrl = await mixAudioFiles(mixingAudioUrl, recording_url);
      recording_url = mixedUrl;
      console.log('Mixed audio URL:', recording_url);
    }

    const date = new Date().toISOString().split('T')[0];    // Insert the layer into the new collabs table
    await sql`
      INSERT INTO collabs (
        member_id, seconds, key, mode, chords, tempo, date, status,
        description, title, genre, recording_url, instrument, parent_theme_id
      ) VALUES (
        ${memberId}, ${seconds}, ${keySignature}, ${mode}, ${chords}, 
        ${tempo}, ${date}, ${status}, ${description}, ${title}, 
        ${genre}, ${recording_url}, ${instrument}, ${parentThemeId}
      )
    `;
    console.log('Layer created successfully in collabs table with title:', title);
    // Make sure parentThemeId is a string before using it with revalidatePath
    const pathToRevalidate = `/dashboard/themes/${String(parentThemeId)}`;
    revalidatePath(pathToRevalidate);
    revalidatePath('/dashboard/collabs'); // Add revalidation for the main collabs page
    
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
      themeId,
    };
  }
}

// Server action to fetch layers for a specific theme
export async function getLayersForThemeAction(themeId: string) {
  'use server';
  // Import the data fetching function here to ensure it runs in the server context
  const { fetchLayersByThemeId } = await import('./data');
  try {
    const layers = await fetchLayersByThemeId(themeId);
    return layers; // Successfully return layers
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch layers:', error);
    // Return a more structured error or an empty array to indicate failure
    return []; // Or throw error to be caught by client if preferred
  }
}

