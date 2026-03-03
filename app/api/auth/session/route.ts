import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/services/auth-service';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
