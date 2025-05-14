import { NextResponse } from 'next/server';
import { createLayer } from '@/app/lib/actions';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    formData.append('themeId', params.id);
    
    const result = await createLayer(null, formData);
    
    if (result?.errors || result?.message) {
      return NextResponse.json(
        { error: result.message || 'Failed to create layer' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating layer:', error);
    return NextResponse.json(
      { error: 'Failed to create layer' },
      { status: 500 }
    );
  }
}