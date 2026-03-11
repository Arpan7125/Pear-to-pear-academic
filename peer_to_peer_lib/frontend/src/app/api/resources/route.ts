import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const resources = store.getAllResources();
  const results = resources.map(r => ({
    resource: r,
    available_peers: r.available_on.length || 1,
    relevance: 1.0,
  }));
  return NextResponse.json({
    success: true,
    data: { query: '', results, total_count: results.length, page: 1, page_size: 100 },
  });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('X-User-ID') || '';
  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const preview = (formData.get('preview') as string) || '';
    const subject = (formData.get('subject') as string) || 'Other';
    const tagsStr = (formData.get('tags') as string) || '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const filename = file?.name || 'untitled.pdf';
    const size = file?.size || 0;

    const resource = store.createResource(filename, size, userId, { title, description, preview, subject, tags });
    return NextResponse.json({ success: true, data: resource });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create resource' }, { status: 400 });
  }
}
