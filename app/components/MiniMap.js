'use client';

import { useMemo } from 'react';
import { clamp } from '../lib/geo';

function createBounds(pois, userPosition) {
  const points = [...pois];
  if (userPosition) {
    points.push({ latitude: userPosition.latitude, longitude: userPosition.longitude });
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latPadding = Math.max((maxLat - minLat) * 0.22, 0.0012);
  const lngPadding = Math.max((maxLng - minLng) * 0.22, 0.0012);

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLng: minLng - lngPadding,
    maxLng: maxLng + lngPadding,
  };
}

function projectPoint(point, bounds) {
  const lngRange = bounds.maxLng - bounds.minLng || 1;
  const latRange = bounds.maxLat - bounds.minLat || 1;

  const x = ((point.longitude - bounds.minLng) / lngRange) * 100;
  const y = 100 - ((point.latitude - bounds.minLat) / latRange) * 100;

  return {
    x: clamp(x, 4, 96),
    y: clamp(y, 4, 96),
  };
}

export default function MiniMap({ pois, userPosition, selectedPoiId }) {
  const mapData = useMemo(() => {
    const bounds = createBounds(pois, userPosition);

    return {
      bounds,
      pois: pois.map((poi) => ({
        ...poi,
        ...projectPoint(poi, bounds),
      })),
      userMarker: userPosition ? projectPoint(userPosition, bounds) : null,
    };
  }, [pois, userPosition]);

  return (
    <div className="mini-map-shell">
      <div className="mini-map-frame" aria-label="Schematische Mini-Map von Leipzig">
        <div className="mini-map-grid" />
        <div className="mini-map-north">N</div>
        <div className="mini-map-axis mini-map-axis-x" />
        <div className="mini-map-axis mini-map-axis-y" />

        {mapData.pois.map((poi) => {
          const isSelected = poi.id === selectedPoiId;
          return (
            <button
              key={poi.id}
              type="button"
              className={`mini-map-marker ${isSelected ? 'is-selected' : ''}`}
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
              aria-label={poi.name}
            >
              <span className="mini-map-marker-dot" />
              <span className="mini-map-marker-label">{poi.name}</span>
            </button>
          );
        })}

        {mapData.userMarker ? (
          <div
            className="mini-map-user"
            style={{ left: `${mapData.userMarker.x}%`, top: `${mapData.userMarker.y}%` }}
            aria-label="Dein Standort"
          >
            <span className="mini-map-user-dot" />
            <span className="mini-map-user-label">Du</span>
          </div>
        ) : (
          <div className="mini-map-placeholder">Standort aktivieren, um dich auf der Karte zu sehen.</div>
        )}
      </div>

      <div className="mini-map-legend">
        <span><i className="legend-dot poi-dot" /> Sehenswürdigkeiten</span>
        <span><i className="legend-dot user-dot" /> Nutzerstandort</span>
      </div>
    </div>
  );
}

