'use client';

import { useMemo } from 'react';

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

export default function Ar3DOverlay({ poiViews, selectedPoiId, onSelectPoi }) {
  // Collision-avoidance: keep a minimum marker distance and spread collisions
  // sideways first, then slightly vertically.
  const rendered = useMemo(() => {
    if (!poiViews || poiViews.length === 0) return [];

    // work on a shallow copy sorted by zIndex (nearest first)
    const copy = [...poiViews].sort((a, b) => b.zIndex - a.zIndex);
    const placed = [];
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 420;

    return copy.map((poi) => {
      let left = poi.left;
      let top = poi.top;
      const markerPx = poi.baseMarkerPx || 48;
      const percentYPerMarker = (markerPx / vh) * 100;

      const minXGap = Math.max((markerPx / vw) * 100 * 0.85, 4.2);
      const minYGap = Math.max(percentYPerMarker * 0.95, 4.6);

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const conflict = placed.find((p) => Math.abs(p.left - left) < minXGap && Math.abs(p.top - top) < minYGap);
        if (!conflict) {
          break;
        }

        const direction = attempt % 2 === 0 ? 1 : -1;
        const spreadMultiplier = 1 + Math.floor(attempt / 2);
        left = clamp(conflict.left + direction * spreadMultiplier * (minXGap * 0.72), 4, 96);
        top = clamp(top - spreadMultiplier * (minYGap * 0.34), 4, 96);
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

