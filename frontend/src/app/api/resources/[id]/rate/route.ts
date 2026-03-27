import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { rating, user_id } = await req.json();
    if (!user_id) return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const resource = store.getResource(id);
    if (!resource) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    if (resource.uploaded_by === user_id) {
      return NextResponse.json({ success: false, error: 'Cannot rate your own resource' }, { status: 403 });
    }

    const updated = store.rateResource(id, rating);
    return NextResponse.json({ success: true, data: { resource_id: id, new_rating: updated?.average_rating } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
