import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || '';
  const subject = req.nextUrl.searchParams.get('subject') || undefined;
  const results = store.searchResources(query, subject).map(r => ({
    resource: r,
    available_peers: r.available_on.length || 1,
    relevance: 1.0,
  }));
  return NextResponse.json({
    success: true,
    data: { query, results, total_count: results.length, page: 1, page_size: 100 },
  });
}
