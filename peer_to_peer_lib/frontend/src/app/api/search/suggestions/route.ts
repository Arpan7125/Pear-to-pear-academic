import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').toLowerCase();
  if (!q) return NextResponse.json({ success: true, data: [] });
  const all = store.getAllResources();
  const suggestions = new Set<string>();
  for (const r of all) {
    if (r.title.toLowerCase().includes(q)) suggestions.add(r.title);
    for (const t of r.tags) {
      if (t.toLowerCase().includes(q)) suggestions.add(t);
    }
    if (suggestions.size >= 8) break;
  }
  return NextResponse.json({ success: true, data: Array.from(suggestions) });
}
