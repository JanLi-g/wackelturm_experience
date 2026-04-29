'use client';

export default function Ar3DOverlay({ poiViews, selectedPoiId, onSelectPoi }) {
  return (
    <div className="ar-3d-overlay-shell">
      <div className="ar-3d-perspective">
        {poiViews.map((poi) => {
          const isSelected = poi.id === selectedPoiId;
          return (
            <button
              key={poi.id}
              type="button"
              className={`ar-3d-marker ${isSelected ? 'is-selected' : ''}`}
              style={{
                left: `${poi.left}%`,
                top: `${poi.top}%`,
                zIndex: poi.zIndex,
                transform: `translate3d(-50%, -50%, ${poi.z3d}px) scale(${poi.scaleZ})`,
                opacity: poi.opacity,
                filter: `blur(${poi.blurAmount}px)`,
              }}
              onClick={() => onSelectPoi(poi.id)}
              aria-label={`${poi.name} öffnen`}
            >
              <span className="ar-3d-marker-inner">
                <span className="ar-3d-marker-icon">i</span>
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

