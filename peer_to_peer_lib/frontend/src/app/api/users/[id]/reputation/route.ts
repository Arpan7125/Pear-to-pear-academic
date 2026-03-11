import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = store.getUser(id);
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  return NextResponse.json({
    success: true,
    data: {
      user_id: user.id,
      score: user.reputation,
      classification: user.classification,
      uploads: user.total_uploads,
      downloads: user.total_downloads,
      average_rating: user.average_rating,
      throttle: user.classification === 'Leecher' ? 0.5 : 1.0,
    },
  });
}
