import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = req.headers.get('X-User-ID') || '';
  const admin = store.getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;
  if (adminId === id) {
    return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 400 });
  }
  if (!store.deleteUser(id)) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: { deleted: id } });
}
