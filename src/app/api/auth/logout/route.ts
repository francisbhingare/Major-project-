import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { removeAdminSession } from '@/lib/auth/authStore';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('emergency_admin_session')?.value;

    if (token) {
      removeAdminSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin session terminated.',
    });

    response.cookies.delete('emergency_admin_session');

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Logout failed.' }, { status: 500 });
  }
}
