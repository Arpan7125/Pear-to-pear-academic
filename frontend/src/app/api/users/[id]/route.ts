import { NextRequest, NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = store.getUser(id);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  return NextResponse.json({ success: true, data: sanitizeUser(user) });
}
