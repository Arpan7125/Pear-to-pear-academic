import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = store.getResource(id);
  if (!resource) return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: resource });
}
