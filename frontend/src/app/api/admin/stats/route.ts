import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(req: NextRequest) {
  const adminId = req.headers.get('X-User-ID') || '';
  const admin = store.getUser(adminId);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  return NextResponse.json({
    success: true,
    data: {
      network: store.getNetworkStats(),
      library: store.getLibraryStats(),
    },
  });
}
