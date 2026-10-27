import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'User registration is disabled. The emergency response system is open to all public users without authentication.' },
    { status: 400 }
  );
}
