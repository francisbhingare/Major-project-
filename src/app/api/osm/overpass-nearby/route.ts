import { NextResponse } from 'next/server';
import { searchNearbyHospitalsOverpass } from '@/lib/services/overpassHospitalService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radius = searchParams.get('radius') || '5';

    if (!lat || !lon) {
      return NextResponse.json({
        success: false,
        error: 'Latitude and longitude coordinates are required.',
      }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const radiusKm = parseFloat(radius);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ success: false, error: 'Invalid latitude coordinate' }, { status: 400 });
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ success: false, error: 'Invalid longitude coordinate' }, { status: 400 });
    }

    const result = await searchNearbyHospitalsOverpass(latitude, longitude, radiusKm);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
