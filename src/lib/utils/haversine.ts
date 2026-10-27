/**
 * Haversine Great-Circle Geodesic Distance Utility
 *
 * IMPORTANT ACADEMIC / TECHNICAL NOTE:
 * This calculates spherical straight-line ("as-the-crow-flies") distance in kilometers.
 * It DOES NOT calculate road driving network distance, traffic congestion, or terrain topography.
 * Road routing should be obtained via third-party turn-by-turn navigation (e.g. Google Maps).
 */

export function isValidCoordinate(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false; // Null Island check
  return true;
}

export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1)) {
    throw new Error(`Invalid origin coordinates: lat=${lat1}, lon=${lon1}`);
  }
  if (!isValidCoordinate(lat2, lon2)) {
    throw new Error(`Invalid destination coordinates: lat=${lat2}, lon=${lon2}`);
  }

  const R = 6371; // Earth's mean radius in kilometers (WGS84 spherical approximation)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place (100-meter precision)
  return Math.round(distance * 10) / 10;
}

/**
 * Explicit alias to make distance type transparent across the codebase
 */
export const calculateStraightLineDistance = calculateHaversineDistance;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
