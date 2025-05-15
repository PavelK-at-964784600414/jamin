import { NextResponse } from 'next/server';
import { createLayer } from '@/app/lib/actions';
import { checkAuth, ALLOWED_AUDIO_TYPES, MAX_FILE_SIZE } from '@/app/lib/api-auth';
import { checkRateLimit } from '@/app/lib/rate-limiter';
import { validateApiCsrf } from '@/app/lib/api-security';
import { z } from 'zod';

// Input validation schema for the layer data
const LayerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  genre: z.string().optional(),
  keySignature: z.string().optional(),
  tempo: z.string().transform(val => parseInt(val) || 0).optional(),
  scale: z.string().optional(),
  chords: z.string().optional(),
  instrument: z.string().optional(),
  mode: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check CSRF validation
    const csrfError = validateApiCsrf(request);
    if (csrfError) return csrfError;
    
    // Check if user is authenticated
    const authError = await checkAuth();
    if (authError) return authError;
    
    // Apply stricter rate limiting for POST requests (content creation)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const { isLimited, resetSeconds } = checkRateLimit(clientIp);
    
    if (isLimited) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${resetSeconds} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(resetSeconds)
          }
        }
      );
    }
    
    const formData = await request.formData();
    formData.append('themeId', params.id);
    
    // Validate file
    const audioFile = formData.get('audioFile');
    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }
    
    // Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }
    
    // Check file type
    if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a supported audio format.' },
        { status: 400 }
      );
    }
    
    // Validate form data
    try {
      const formDataObj: Record<string, any> = {};
      formData.forEach((value, key) => {
        if (key !== 'audioFile') {
          formDataObj[key] = value;
        }
      });
      
      LayerSchema.parse(formDataObj);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: 'Invalid form data', details: (validationError as Error).message },
        { status: 400 }
      );
    }
    
    try {
      // Call the server action
      await createLayer(null, formData);
      
      // If we got here, layer creation was successful
      // Return a redirect to the theme page
      return NextResponse.json({ 
        success: true,
        message: 'Layer created successfully',
        redirectTo: `/dashboard/themes/${params.id}`
      });
    } catch (error) {
      // If the server action threw an error, it might be a validation error
      console.error('Layer creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create layer' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json(
      { error: 'Failed to create layer' },
      { status: 500 }
    );
  }
}