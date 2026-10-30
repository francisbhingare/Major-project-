import { useState, useCallback, useEffect } from 'react';
import { LocationData, GpsQuality } from '@/types/emergency';
import { isValidCoordinate } from '@/lib/utils/haversine';

export function calculateGpsQuality(accuracyMeters?: number): GpsQuality {
  if (!accuracyMeters) return 'LOW';
  if (accuracyMeters < 15) return 'HIGH';
  if (accuracyMeters <= 50) return 'MEDIUM';
  return 'LOW';
}

export function validateCoordinates(lat: number, lon: number): boolean {
  return isValidCoordinate(lat, lon);
}

export type GeolocationPermissionStatus = 
  | 'PROMPT'
  | 'GRANTED'
  | 'DENIED'
  | 'TIMEOUT'
  | 'UNAVAILABLE'
  | 'UNSUPPORTED';

export function useGeolocation(options: { autoCapture?: boolean } = {}) {
  const { autoCapture = false } = options;
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionStatus>('PROMPT');
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  const getRealLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errMsg = 'Geolocation API is not supported by your browser or device. Please enter your address or coordinates manually.';
        setError(errMsg);
        setPermissionState('UNSUPPORTED');
        return reject(new Error(errMsg));
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = Math.round(position.coords.accuracy);

          if (!validateCoordinates(lat, lon)) {
            const boundErr = `Received invalid GPS coordinates from device (lat=${lat}, lon=${lon}).`;
            setError(boundErr);
            setLoading(false);
            return reject(new Error(boundErr));
          }

          const quality = calculateGpsQuality(accuracy);
          const locData: LocationData = {
            latitude: lat,
            longitude: lon,
            accuracy,
            quality,
            source: 'DEVICE_GPS',
            is_demo: false,
            address: `Device GPS Lock (±${accuracy}m accuracy)`,
            timestamp: new Date(position.timestamp).toISOString(),
          };

          setLocation(locData);
          setPermissionState('GRANTED');
          setLoading(false);
          resolve(locData);
        },
        (err) => {
          setLoading(false);
          let msg = 'Unable to determine your current location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your browser or enter your location manually below.';
            setPermissionState('DENIED');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS location is currently unavailable from your device. Please ensure location services are enabled, or enter your location manually below.';
            setPermissionState('UNAVAILABLE');
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS acquisition request timed out. Please retry or enter your address manually below.';
            setPermissionState('TIMEOUT');
          }
          setError(msg);
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    });
  }, []);

  const captureLocation = useCallback(() => {
    getRealLocation().catch((err) => {
      console.warn('[Geolocation] Capture ended with notice:', err.message);
    });
  }, [getRealLocation]);

  useEffect(() => {
    if (autoCapture && typeof window !== 'undefined' && navigator.geolocation) {
      captureLocation();
    }
  }, [autoCapture, captureLocation]);

  /**
   * Set location directly using valid numeric latitude and longitude
   */
  const setManualLocation = useCallback((lat: number, lon: number, address?: string) => {
    if (!validateCoordinates(lat, lon)) {
      setError(`Invalid coordinates provided: lat=${lat}, lon=${lon}. Latitude must be -90 to 90, longitude -180 to 180.`);
      return;
    }

    setLocation({
      latitude: lat,
      longitude: lon,
      accuracy: 10,
      quality: 'HIGH',
      source: 'MANUAL',
      is_demo: false,
      address: address || `Manual Coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      timestamp: new Date().toISOString(),
    });
    setError(null);
    setPermissionState('GRANTED');
  }, []);

  /**
   * Geocodes an entered address/landmark/city into real GPS coordinates via /api/geocode
   */
  const geocodeAndSetLocation = useCallback(async (query: string): Promise<LocationData> => {
    if (!query || !query.trim()) {
      throw new Error('Please enter a location, landmark, or city name.');
    }

    setIsGeocoding(true);
    setError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.location) {
        throw new Error(data.error || `Could not find coordinates for "${query}". Please check spelling or enter a nearby city.`);
      }

      const loc: LocationData = {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        accuracy: 15,
        quality: 'HIGH',
        source: 'MANUAL',
        is_demo: false,
        address: data.location.address || query,
        timestamp: new Date().toISOString(),
      };

      setLocation(loc);
      setPermissionState('GRANTED');
      return loc;
    } catch (err: any) {
      setError(err.message || 'Geocoding failed.');
      throw err;
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return {
    location,
    loading,
    error,
    permissionState,
    isGeocoding,
    captureLocation,
    getRealLocation,
    setManualLocation,
    geocodeAndSetLocation,
    clearLocation,
  };
}
