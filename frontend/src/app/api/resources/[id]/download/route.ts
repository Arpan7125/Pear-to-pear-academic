import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get('user_id') || req.headers.get('X-User-ID') || '';
  const resource = store.downloadResource(id, userId);
  if (!resource) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
  // On serverless we can't serve physical files, so return resource metadata
  return NextResponse.json({ success: true, data: resource });
}
