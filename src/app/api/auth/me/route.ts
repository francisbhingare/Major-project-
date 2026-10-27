import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/auth/authStore';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('emergency_admin_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const session = getAdminSession(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: 'admin',
      },
      session,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
