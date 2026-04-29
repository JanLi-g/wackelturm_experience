'use client';

import { useMemo } from 'react';

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export default function Ar3DOverlay({ poiViews, selectedPoiId, onSelectPoi }) {
  // Simple collision-avoidance: when markers are too close on screen, stack them
  // upward in small offsets so labels remain readable.
  const rendered = useMemo(() => {
    if (!poiViews || poiViews.length === 0) return [];

    // work on a shallow copy sorted by zIndex (nearest first)
    const copy = [...poiViews].sort((a, b) => b.zIndex - a.zIndex);
    const placed = [];
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    return copy.map((poi) => {
      let left = poi.left;
      let top = poi.top;
      const markerPx = poi.baseMarkerPx || 48;
      const percentYPerMarker = (markerPx / vh) * 100;

      // Count how many nearby markers already placed and offset accordingly
      let overlapCount = 0;
      for (const p of placed) {
        const dx = Math.abs(p.left - left);
        const dy = Math.abs(p.top - top);
        if (dx < 6 && dy < 6) {
          overlapCount += 1;
        }
      }

      if (overlapCount > 0) {
        // move upward for each overlap to avoid exact stacking
        top = clamp(top - overlapCount * (percentYPerMarker + 2), 4, 96);
      }

      placed.push({ left, top });

      return {
        ...poi,
        renderLeft: left,
        renderTop: top,
        markerPx,
        transformScale: (poi.scale || 1) * (poi.scaleZ || 1),
      };
    });
  }, [poiViews]);

  return (
    <div className="ar-3d-overlay-shell">
      <div className="ar-3d-perspective">
        {rendered.map((poi) => {
          const isSelected = poi.id === selectedPoiId;
          return (
            <button
              key={poi.id}
              type="button"
              className={`ar-3d-marker ${isSelected ? 'is-selected' : ''}`}
              style={{
                left: `${poi.renderLeft}%`,
                top: `${poi.renderTop}%`,
                zIndex: poi.zIndex,
                transform: `translate3d(-50%, -50%, ${poi.z3d}px) scale(${poi.transformScale})`,
                opacity: poi.opacity,
                filter: `blur(${poi.blurAmount}px)`,
              }}
              onClick={() => onSelectPoi(poi.id)}
              aria-label={`${poi.name} öffnen`}
            >
              <span className="ar-3d-marker-inner">
                <span
                  className="ar-3d-marker-icon"
                  style={{ width: poi.markerPx, height: poi.markerPx, lineHeight: `${poi.markerPx}px` }}
                >
                  i
                </span>
                <span className="ar-3d-marker-label">{poi.name}</span>
                <span className="ar-3d-marker-distance">{poi.distanceLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

