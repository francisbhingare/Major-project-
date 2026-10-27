'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Hospital, LocationData } from '@/types/emergency';
import { MapPin, RefreshCw, Navigation } from 'lucide-react';

interface MapProps {
  userLocation?: LocationData | null;
  hospitals?: Hospital[];
  recommendedHospitalId?: string;
  selectedHospitalId?: string;
  height?: string;
  onRefreshLocation?: () => void;
  onRefreshHospitals?: () => void;
  isRefreshingLocation?: boolean;
  isRefreshingHospitals?: boolean;
}

export function InteractiveMap({
  userLocation = null,
  hospitals = [],
  recommendedHospitalId,
  selectedHospitalId,
  height = '420px',
  onRefreshLocation,
  onRefreshHospitals,
  isRefreshingLocation = false,
  isRefreshingHospitals = false,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const isValidCoord = (lat: any, lon: any): boolean => {
      const numLat = Number(lat);
      const numLon = Number(lon);
      return !isNaN(numLat) && isFinite(numLat) && !isNaN(numLon) && isFinite(numLon) && numLat !== 0 && numLon !== 0;
    };

    const initializeMap = (L: any) => {
      if (!mapContainerRef.current) return;

      try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
      } catch (e) {
        // Fallback silently
      }

      const userLat = userLocation && isValidCoord(userLocation.latitude, userLocation.longitude)
        ? Number(userLocation.latitude)
        : null;
      const userLon = userLocation && isValidCoord(userLocation.latitude, userLocation.longitude)
        ? Number(userLocation.longitude)
        : null;

      const firstHospWithCoord = (hospitals || []).find((h) => isValidCoord(h.latitude, h.longitude));

      const defaultLat = userLat !== null ? userLat : (firstHospWithCoord ? Number(firstHospWithCoord.latitude) : 19.0760);
      const defaultLon = userLon !== null ? userLon : (firstHospWithCoord ? Number(firstHospWithCoord.longitude) : 72.8777);

      if (!mapInstanceRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLon],
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers safely
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });

      const boundsPoints: [number, number][] = [];

      // Plot User Location Marker with Pulsing Ring & Accuracy Circle
      if (userLat !== null && userLon !== null && userLocation) {
        boundsPoints.push([userLat, userLon]);

        const userIcon = L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="position: absolute; inset: -6px; background-color: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 24px; height: 24px; background-color: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 14px rgba(37, 99, 235, 0.8); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
                ●
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14],
        });

        const userMarker = L.marker([userLat, userLon], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 4px; font-weight: bold; color: #2563eb; font-size: 12px;">
              📍 YOUR LIVE GPS LOCATION
            </div>
            <p style="font-size: 11px; color: #475569; margin: 4px 0; font-family: monospace;">
              ${userLat.toFixed(6)}, ${userLon.toFixed(6)}
            </p>
            ${userLocation.accuracy ? `<div style="font-size: 10px; color: #059669; font-weight: 600;">Accuracy Radius: ±${Math.round(userLocation.accuracy)} meters</div>` : ''}
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Source: ${userLocation.source || 'DEVICE_GPS'}</div>
          </div>
        `);

        if (userLocation.accuracy && typeof userLocation.accuracy === 'number' && userLocation.accuracy <= 2000) {
          L.circle([userLat, userLon], {
            radius: userLocation.accuracy,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(map);
        }
      }

      // Plot Real Hospitals from Google Places / OpenStreetMap Overpass
      if (Array.isArray(hospitals)) {
        hospitals.forEach((hosp) => {
          if (!hosp || !isValidCoord(hosp.latitude, hosp.longitude)) return;

          const hospLat = Number(hosp.latitude);
          const hospLon = Number(hosp.longitude);
          boundsPoints.push([hospLat, hospLon]);

          const isRec = hosp.id === recommendedHospitalId;
          const isSelected = hosp.id === selectedHospitalId;

          let pinColor = '#10b981'; // Green standard
          let pinLabel = 'HOSPITAL';
          let zIndex = 200;

          if (isRec) {
            pinColor = '#ef4444'; // Red recommended
            pinLabel = '⭐ RECOMMENDED';
            zIndex = 500;
          } else if (isSelected) {
            pinColor = '#f59e0b'; // Amber selected
            pinLabel = '📍 SELECTED';
            zIndex = 400;
          }

          // Exact teardrop SVG pin with tip precisely at [15, 38]
          const pinSvgHtml = `
            <div style="position: relative; width: 30px; height: 38px; cursor: pointer; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
              <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 0C6.71573 0 0 6.71573 0 15C0 24.5 15 38 15 38C15 38 30 24.5 30 15C30 6.71573 23.2843 0 15 0Z" fill="${pinColor}"/>
                <circle cx="15" cy="14" r="8" fill="#ffffff"/>
                <path d="M13.5 10H16.5V12.5H19V15.5H16.5V18H13.5V15.5H11V12.5H13.5V10Z" fill="${pinColor}"/>
              </svg>
              ${isRec ? `<span style="position: absolute; top: -16px; left: 50%; transform: translateX(-50%); background-color: #ef4444; color: #ffffff; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 6px; white-space: nowrap; border: 1px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">TOP MATCH</span>` : ''}
            </div>
          `;

          const hospIcon = L.divIcon({
            className: 'custom-hosp-pin',
            html: pinSvgHtml,
            iconSize: [30, 38],
            iconAnchor: [15, 38], // Pin tip is precisely at bottom center
            popupAnchor: [0, -38],
          });

          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospLat},${hospLon}`;
          const distanceDisplay = hosp.distanceKm !== undefined ? `${hosp.distanceKm.toFixed(1)} km straight-line` : 'Calculated on GPS Lock';

          const marker = L.marker([hospLat, hospLon], { icon: hospIcon, zIndexOffset: zIndex }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: sans-serif; min-width: 210px; color: #0f172a;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 4px;">
                <span style="font-size: 10px; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">${pinLabel}</span>
                <span style="font-size: 9px; font-family: monospace; background-color: #f1f5f9; padding: 1px 4px; border-radius: 4px; color: #64748b;">${hosp.is_demo ? 'DEMO PROFILE' : (hosp.source === 'GOOGLE_PLACES' ? 'GOOGLE PLACES' : 'OPENSTREETMAP')}</span>
              </div>
              <h4 style="margin: 2px 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.2;">${hosp.name}</h4>
              <p style="margin: 2px 0; font-size: 11px; color: #475569; line-height: 1.3;">${hosp.address || 'Address verified on map'}</p>
              
              <div style="margin: 6px 0; padding: 4px 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 10px; color: #166534; display: flex; align-items: center; justify-content: space-between;">
                <span>Straight-Line Dist:</span>
                <strong style="font-family: monospace;">${distanceDisplay}</strong>
              </div>
              <div style="font-size: 9px; color: #64748b; margin-bottom: 4px; font-style: italic;">Turn-by-turn driving routing available via Google Maps</div>

              ${hosp.phone ? `<div style="font-size: 10px; color: #334155; margin-bottom: 4px;">📞 ${hosp.phone}</div>` : ''}

              <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; background-color: #2563eb; color: #ffffff; font-size: 11px; font-weight: 700; padding: 6px 10px; border-radius: 8px; text-decoration: none; margin-top: 6px;">
                🧭 Open Directions in Google Maps
              </a>
            </div>
          `);
        });
      }

      // Auto-fit map viewport to show both User GPS position AND Hospital Markers
      if (boundsPoints.length > 1) {
        try {
          map.fitBounds(boundsPoints, { padding: [45, 45], maxZoom: 15 });
        } catch (fitErr) {
          if (userLat !== null && userLon !== null) {
            map.setView([userLat, userLon], 13);
          }
        }
      } else if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 14);
      }

      setMapLoaded(true);
    };

    if ((window as any).L) {
      initializeMap((window as any).L);
    } else {
      const existingScript = document.getElementById('leaflet-js');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if ((window as any).L) initializeMap((window as any).L);
        });
      } else {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
        script.onload = () => {
          if ((window as any).L) {
            initializeMap((window as any).L);
          }
        };
        document.body.appendChild(script);
      }
    }
  }, [userLocation, hospitals, recommendedHospitalId, selectedHospitalId]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Silent cleanup
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Top Map Control Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        {onRefreshLocation && (
          <button
            onClick={onRefreshLocation}
            disabled={isRefreshingLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-blue-400 text-xs font-semibold border border-blue-500/30 backdrop-blur shadow-md transition disabled:opacity-50"
            title="Re-acquire Browser GPS position"
          >
            <Navigation className={`w-3.5 h-3.5 ${isRefreshingLocation ? 'animate-spin' : ''}`} />
            <span>{isRefreshingLocation ? 'Locating...' : 'Refresh Location'}</span>
          </button>
        )}
        {onRefreshHospitals && (
          <button
            onClick={onRefreshHospitals}
            disabled={isRefreshingHospitals}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-emerald-400 text-xs font-semibold border border-emerald-500/30 backdrop-blur shadow-md transition disabled:opacity-50"
            title="Re-query OpenStreetMap Overpass API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingHospitals ? 'animate-spin' : ''}`} />
            <span>{isRefreshingHospitals ? 'Querying OSM...' : 'Refresh Hospitals'}</span>
          </button>
        )}
      </div>

      {!userLocation && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center text-xs text-slate-400 z-10 p-4 text-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400 animate-bounce" />
            <span>Click [USE MY CURRENT LOCATION] to acquire GPS and display OpenStreetMap</span>
          </div>
        </div>
      )}
    </div>
  );
}
