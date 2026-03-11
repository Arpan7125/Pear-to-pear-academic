import { NextResponse } from 'next/server';
import { store, sanitizeUser } from '@/lib/store';

export async function GET() {
  const users = store.getAllUsers();
  const peers = users.map(u => ({
    id: u.peer_id,
    user_id: u.id,
    username: u.username,
    status: u.status,
    reputation: u.reputation,
    classification: u.classification,
    shared_resources: u.total_uploads,
    ip_address: u.ip_address,
  }));
  return NextResponse.json({ success: true, data: peers });
}
