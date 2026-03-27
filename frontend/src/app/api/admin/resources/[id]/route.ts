import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = req.headers.get('X-User-ID') || '';
  const admin = store.getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;
  if (!store.deleteResource(id)) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { deleted: id } });
}
