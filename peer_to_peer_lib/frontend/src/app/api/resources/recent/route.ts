import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
  return NextResponse.json({ success: true, data: store.getRecentResources(limit) });
}
