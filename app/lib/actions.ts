'use server';
 
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signUp, signOut } from '@/auth';
import { uploadToS3 } from './s3';
import { LikeActionResponse, LikeType, LikeStats } from './definitions';
import { fetchThemeById, fetchLayersByThemeId, fetchCollaborationById } from './data';
import { uploadFileToS3WithRetry } from '@/app/lib/upload-utils';

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
      key: formData.get('keySignature') ?? "",      tempo: formData.get('tempo') ? Number(formData.get('tempo')) : undefined,
      audioFile: formData.get('audioFile'),
      instrument: formData.get('instrument'),
      scale: formData.get('scale') ?? "",
      mode: formData.get('mode') ?? "",
      chords: formData.get('chords'),
    });

    // Get duration from form data
    const submittedDuration = formData.get('duration');
    const seconds = submittedDuration ? Number(submittedDuration) : 0;

    
    if (!validatedFields.success) {
      console.error('Validation failed:', validatedFields.error);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing or Invalid Fields. Failed to Create Theme.',
        success: false,
      };
    }    const { title, description, genre, key, tempo, audioFile, instrument, scale, mode, chords } = validatedFields.data;
    let recording_url = null;
    const status = 'in progress';
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
    };  }

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
    
    // Get duration from form data
    const submittedDuration = formData.get('duration');
    const seconds = submittedDuration ? Number(submittedDuration) : 0;
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
            });            // Use the uploadFileToS3WithRetry utility which handles environment differences
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
      try {
        // Use a server-side ffmpeg utility to mix the base audio (theme or collaboration) with new layer audio
        const { mixAudioFiles } = await import('./audio-mix-server');
        const mixedUrl = await mixAudioFiles(mixingAudioUrl, recording_url);
        recording_url = mixedUrl;
        console.log('Mixed audio URL:', recording_url);
      } catch (mixingError) {
        console.warn('Audio mixing failed, using layer recording as-is:', mixingError);
        // Continue with the original recording_url - this allows the layer to be created without mixing
      }
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
  try {
    const layers = await fetchLayersByThemeId(themeId);
    return layers; // Successfully return layers
  } catch (error) {
    console.error('[Server Action Error] Failed to fetch layers:', error);
    // Return a more structured error or an empty array to indicate failure
    return []; // Or throw error to be caught by client if preferred
  }
}

// Like/Dislike Actions
export async function toggleThemeLike(themeId: string, likeType: LikeType): Promise<LikeActionResponse> {
  try {
    // Get the current session
    const session = await auth();
    const memberId = session?.user?.id;
    
    if (!memberId) {
      console.warn('User not authenticated. Using default member id for testing.');
      // For testing purposes, use default member id
      // In production, you would return an error here
      return {
        success: false,
        message: 'User not authenticated.'
      };
    }

    // Check if user already has a like/dislike for this theme
    const existingLike = await sql`
      SELECT like_type FROM theme_likes 
      WHERE theme_id = ${themeId} AND member_id = ${memberId}
    `;

    if (existingLike.rows.length > 0) {
      const currentLikeType = existingLike.rows[0].like_type;
      
      if (currentLikeType === likeType) {
        // User is clicking the same type - remove the like/dislike
        await sql`
          DELETE FROM theme_likes 
          WHERE theme_id = ${themeId} AND member_id = ${memberId}
        `;
      } else {
        // User is switching from like to dislike or vice versa
        await sql`
          UPDATE theme_likes 
          SET like_type = ${likeType}, updated_at = NOW()
          WHERE theme_id = ${themeId} AND member_id = ${memberId}
        `;
      }
    } else {
      // User hasn't liked/disliked this theme yet - create new entry
      await sql`
        INSERT INTO theme_likes (theme_id, member_id, like_type)
        VALUES (${themeId}, ${memberId}, ${likeType})
      `;
    }

    // Fetch updated like stats
    const likeStats = await getThemeLikeStats(themeId, memberId);
    
    // Revalidate relevant pages
    revalidatePath('/dashboard/themes');
    revalidatePath('/dashboard/profile');
    
    return {
      success: true,
      like_stats: likeStats
    };
  } catch (error) {
    console.error('Error toggling theme like:', error);
    return {
      success: false,
      message: 'Failed to update like status.'
    };
  }
}

export async function toggleCollabLike(collabId: string, likeType: LikeType): Promise<LikeActionResponse> {
  try {
    // Get the current session
    const session = await auth();
    const memberId = session?.user?.id;
    
    if (!memberId) {
      console.warn('User not authenticated. Using default member id for testing.');
      // For testing purposes, use default member id
      // In production, you would return an error here
      return {
        success: false,
        message: 'User not authenticated.'
      };
    }

    // Check if user already has a like/dislike for this collaboration
    const existingLike = await sql`
      SELECT like_type FROM collab_likes 
      WHERE collab_id = ${collabId} AND member_id = ${memberId}
    `;

    if (existingLike.rows.length > 0) {
      const currentLikeType = existingLike.rows[0].like_type;
      
      if (currentLikeType === likeType) {
        // User is clicking the same type - remove the like/dislike
        await sql`
          DELETE FROM collab_likes 
          WHERE collab_id = ${collabId} AND member_id = ${memberId}
        `;
      } else {
        // User is switching from like to dislike or vice versa
        await sql`
          UPDATE collab_likes 
          SET like_type = ${likeType}, updated_at = NOW()
          WHERE collab_id = ${collabId} AND member_id = ${memberId}
        `;
      }
    } else {
      // User hasn't liked/disliked this collaboration yet - create new entry
      await sql`
        INSERT INTO collab_likes (collab_id, member_id, like_type)
        VALUES (${collabId}, ${memberId}, ${likeType})
      `;
    }    // Fetch updated like stats
    const likeStats = await getCollabLikeStats(collabId, memberId);
    
    // Revalidate relevant pages
    revalidatePath('/dashboard/collabs');
    revalidatePath('/dashboard/profile');
    
    return {
      success: true,
      like_stats: likeStats
    };
  } catch (error) {
    console.error('Error toggling collaboration like:', error);
    return {
      success: false,
      message: 'Failed to update like status.'
    };
  }
}

// Helper function to get theme like stats
export async function getThemeLikeStats(themeId: string, userId?: string): Promise<LikeStats> {
  try {
    // Get like and dislike counts
    const stats = await sql`
      SELECT 
        COUNT(CASE WHEN like_type = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN like_type = 'dislike' THEN 1 END) as dislikes
      FROM theme_likes 
      WHERE theme_id = ${themeId}
    `;

    const likes = Number(stats.rows[0]?.likes || 0);
    const dislikes = Number(stats.rows[0]?.dislikes || 0);

    let userLike: LikeType | null = null;
    
    // Get user's current like status if userId provided
    if (userId) {
      const userLikeResult = await sql`
        SELECT like_type FROM theme_likes 
        WHERE theme_id = ${themeId} AND member_id = ${userId}
      `;
      
      if (userLikeResult.rows.length > 0) {
        userLike = userLikeResult.rows[0].like_type as LikeType;
      }
    }

    return {
      likes,
      dislikes,
      userLike
    };
  } catch (error) {
    console.error('Error fetching theme like stats:', error);
    return {
      likes: 0,
      dislikes: 0,
      userLike: null
    };
  }
}

// Helper function to get collaboration like stats
export async function getCollabLikeStats(collabId: string, userId?: string): Promise<LikeStats> {
  try {
    // Get like and dislike counts
    const stats = await sql`
      SELECT 
        COUNT(CASE WHEN like_type = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN like_type = 'dislike' THEN 1 END) as dislikes
      FROM collab_likes 
      WHERE collab_id = ${collabId}
    `;

    const likes = Number(stats.rows[0]?.likes || 0);
    const dislikes = Number(stats.rows[0]?.dislikes || 0);

    let userLike: LikeType | null = null;
    
    // Get user's current like status if userId provided
    if (userId) {
      const userLikeResult = await sql`
        SELECT like_type FROM collab_likes 
        WHERE collab_id = ${collabId} AND member_id = ${userId}
      `;
      
      if (userLikeResult.rows.length > 0) {
        userLike = userLikeResult.rows[0].like_type as LikeType;
      }
    }

    return {
      likes,
      dislikes,
      userLike
    };
  } catch (error) {
    console.error('Error fetching collaboration like stats:', error);
    return {
      likes: 0,
      dislikes: 0,
      userLike: null
    };
  }
}

