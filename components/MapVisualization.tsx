import React, { useEffect, useRef, useState } from 'react';
import { AggregateResponse, InsightType, PlaceResult } from '../types';

interface MapVisualizationProps {
  data: AggregateResponse | null;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Global callback for Google Maps API
declare global {
  interface Window {
    initMap?: () => void;
    google?: any;
  }
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    // Already loaded?
    if (window.google?.maps) {
      setIsApiLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("Google Maps API Key missing for visualization");
      return;
    }

    // Check if script is already present (e.g. from previous render in Strict Mode)
    const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);
    if (existingScript) {
      // Wait for it to define window.google
      const checkInterval = setInterval(() => {
        if (window.google?.maps) {
          setIsApiLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsApiLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script checking interval if unmounted
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = { lat: 35.2271, lng: -80.8431 }; // Charlotte default
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapId: 'DEMO_MAP_ID', // Required for advanced markers if used, or just good practice
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    } catch (e) {
      console.error("Error initializing map", e);
    }
  }, [isApiLoaded]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !data || data.insightType !== InsightType.PLACES || !data.places) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    const infoWindow = new window.google.maps.InfoWindow();

    data.places.forEach((place) => {
      if (!place.location || !place.location.lat) return;

      const position = { lat: place.location.lat, lng: place.location.lng };
      bounds.extend(position);

      // Color coding
      let pinColor = '#94a3b8'; // gray-400
      if (place.fit.score >= 80) pinColor = '#10b981'; // emerald-500
      else if (place.fit.score >= 50) pinColor = '#fbbf24'; // amber-400

      // Create marker
      const marker = new window.google.maps.Marker({
        position,
        map,
        title: place.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: pinColor,
          fillOpacity: 0.9,
          strokeWeight: 1,
          strokeColor: '#ffffff',
        }
      });

      marker.addListener('click', () => {
        const content = `
                <div style="padding: 4px; max-width: 200px;">
                    <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${place.name}</strong>
                    <div style="font-size: 12px; color: #64748b;">
                        Fit Score: <span style="font-weight: bold; color: ${pinColor === '#10b981' ? '#059669' : '#d97706'}">${place.fit.score}</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                        ${place.types[0]} • ${place.priceLevel || '?'}
                    </div>
                </div>
             `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
        setSelectedPlace(place);
      });

      markersRef.current.push(marker);
    });

    if (data.places.length > 0) {
      map.fitBounds(bounds, 50); // 50px padding
    }

  }, [data, isApiLoaded]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-500 text-sm p-4 text-center">
        Map Visualization requires VITE_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 border-l border-slate-200">
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs z-10">
        <h4 className="font-semibold mb-2 text-slate-700">Fit Score</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm"></span>
            <span className="text-slate-600">High Fit (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-sm"></span>
            <span className="text-slate-600">Moderate Fit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400 border border-white shadow-sm"></span>
            <span className="text-slate-600">Low Fit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapVisualization;