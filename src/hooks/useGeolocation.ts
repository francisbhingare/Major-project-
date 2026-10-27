import { useState, useCallback, useEffect } from 'react';
import { LocationData, GpsQuality, LocationSource } from '@/types/emergency';
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

export function useGeolocation(options: { autoCapture?: boolean } = {}) {
  const { autoCapture = false } = options;
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'PROMPT' | 'GRANTED' | 'DENIED' | 'UNSUPPORTED'>('PROMPT');

  const getRealLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errMsg = 'Geolocation API is not supported by your browser or device.';
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
          let msg = 'UNABLE TO DETERMINE CURRENT LOCATION';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'LOCATION PERMISSION DENIED. Please enable browser GPS permissions or enter location manually.';
            setPermissionState('DENIED');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'GPS satellite position unavailable. Please ensure location services are enabled on device.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'GPS acquisition request timed out. Please retry or enter address manually.';
          }
          setError(msg);
          // CRITICAL: NEVER silently substitute fallback demo coordinates on error
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000,
        }
      );
    });
  }, []);

  const captureLocation = useCallback(() => {
    getRealLocation().catch((err) => {
      console.warn('[Geolocation] Capture attempt ended with error:', err.message);
    });
  }, [getRealLocation]);

  useEffect(() => {
    if (autoCapture && typeof window !== 'undefined' && navigator.geolocation) {
      captureLocation();
    }
  }, [autoCapture, captureLocation]);

  const setManualLocation = useCallback((lat: number, lon: number, address?: string) => {
    if (!validateCoordinates(lat, lon)) {
      setError(`Invalid manual coordinates provided: lat=${lat}, lon=${lon}. Lat must be -90 to 90, Lon -180 to 180.`);
      return;
    }

    setLocation({
      latitude: lat,
      longitude: lon,
      accuracy: 10,
      quality: 'HIGH',
      source: 'MANUAL',
      is_demo: false,
      address: address || `Manual Pin (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      timestamp: new Date().toISOString(),
    });
    setError(null);
  }, []);

  const setDemoLocation = useCallback((lat: number = 19.0760, lon: number = 72.8777, label: string = 'Demo Simulation Coordinates (Not Live GPS)') => {
    setLocation({
      latitude: lat,
      longitude: lon,
      accuracy: 50,
      quality: 'LOW',
      source: 'DEMO',
      is_demo: true,
      address: label,
      timestamp: new Date().toISOString(),
    });
    setError(null);
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
    captureLocation,
    getRealLocation,
    setManualLocation,
    setDemoLocation,
    clearLocation,
  };
}
