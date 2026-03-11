import { NextRequest, NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }
    const user = store.findUserByUsername(username);
    if (!user || user.password !== password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
    user.last_active_at = new Date().toISOString();
    user.status = 'online';
    return NextResponse.json({ success: true, data: { user: sanitizeUser(user), token: `token-${user.id}` } });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
