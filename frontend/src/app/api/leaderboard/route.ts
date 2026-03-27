import { NextRequest, NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');
  const leaderboard = store.getLeaderboard(limit).map(sanitizeUser);
  return NextResponse.json({ success: true, data: leaderboard });
}
