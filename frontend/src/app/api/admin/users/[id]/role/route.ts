import { NextRequest, NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = req.headers.get('X-User-ID') || '';
  const admin = store.getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  const { id } = await params;
  try {
    const { role } = await req.json();
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ success: false, error: "Role must be 'admin' or 'user'" }, { status: 400 });
    }
    const user = store.getUser(id);
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    user.role = role;
    return NextResponse.json({ success: true, data: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
