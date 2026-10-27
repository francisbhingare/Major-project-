import { NextResponse } from 'next/server';
import { getDatabaseHealth } from '@/lib/db/store';
import { isGooglePlacesConfigured, getGooglePlacesApiKey } from '@/lib/services/googlePlacesService';
import { isSupabaseConfigured } from '@/lib/db/supabaseClient';

export async function GET() {
  try {
    const dbHealth = getDatabaseHealth();
    const googlePlacesConfigured = isGooglePlacesConfigured();
    const supabaseConfigured = isSupabaseConfigured();

    const openaiConfigured = Boolean(
      process.env.OPENAI_API_KEY &&
      !process.env.OPENAI_API_KEY.includes('your_openai') &&
      process.env.OPENAI_API_KEY.trim().length > 10
    );

    const emailConfigured = Boolean(
      process.env.EMAIL_API_KEY &&
      !process.env.EMAIL_API_KEY.includes('your_resend') &&
      process.env.EMAIL_API_KEY.trim().length > 10
    );

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'ONLINE',
          ...dbHealth,
        },
        google_places: {
          configured: googlePlacesConfigured,
          status: googlePlacesConfigured ? 'READY' : 'CREDENTIALS_MISSING',
          required_env: 'GOOGLE_PLACES_API_KEY',
          message: googlePlacesConfigured
            ? 'Official Google Places Nearby Search active.'
            : 'GOOGLE_PLACES_API_KEY is not configured. Live OpenStreetMap Overpass will be used as the live fallback.',
        },
        openstreetmap_overpass: {
          status: 'READY',
          endpoint: process.env.OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter',
          requires_key: false,
          description: 'Live open-source healthcare GIS query engine with multi-server failover.',
        },
        openai_triage_engine: {
          configured: openaiConfigured,
          status: openaiConfigured ? 'READY' : 'MOCK_OR_RULE_BASED',
          required_env: 'OPENAI_API_KEY',
        },
        email_dispatcher: {
          configured: emailConfigured,
          status: emailConfigured ? 'READY' : 'DISABLED',
          required_env: 'EMAIL_API_KEY',
        },
      },
      missing_credentials: [
        !googlePlacesConfigured && 'GOOGLE_PLACES_API_KEY',
        !supabaseConfigured && 'SUPABASE_URL and SUPABASE_ANON_KEY',
        !openaiConfigured && 'OPENAI_API_KEY',
        !emailConfigured && 'EMAIL_API_KEY',
      ].filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
