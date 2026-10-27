import { NextResponse } from 'next/server';
import { authenticateAdmin, createAdminSession } from '@/lib/auth/authStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Admin Email and Password are required.' },
        { status: 400 }
      );
    }

    const admin = authenticateAdmin(email, password);
    const session = createAdminSession(admin);

    const response = NextResponse.json({
      success: true,
      message: 'Admin authorization successful.',
      user: admin,
      session_token: session.token,
    });

    response.cookies.set({
      name: 'emergency_admin_session',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Admin authentication failed.' },
      { status: 401 }
    );
  }
}
