import { NextRequest, NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function GET() {
  const users = store.getAllUsers().map(sanitizeUser);
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: 'Username, email, and password required' }, { status: 400 });
    }
    if (store.findUserByUsername(username)) {
      return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 409 });
    }
    const user = store.createUser(username, email, password);
    return NextResponse.json({ success: true, data: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
}
