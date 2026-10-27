import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminSession } from '@/lib/auth/authStore';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('emergency_admin_session')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const session = getAdminSession(token);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin privileges required.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      users: [
        {
          id: session.user_id,
          name: session.name,
          email: session.email,
          role: 'admin',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch admin users.' }, { status: 500 });
  }
}
