'use client';

export default function PoiOverlay({
  poiViews,
  selectedPoiId,
  onSelectPoi,
  zoom,
  onZoomChange,
  geoState,
  headingState,
}) {
  const geoLabel =
    geoState === 'ready'
      ? 'Standort bereit'
      : geoState === 'loading'
        ? 'Standort wird angefragt …'
        : geoState === 'blocked'
          ? 'Standort nicht verfügbar'
          : 'Standort optional';

  const compassLabel =
    headingState === 'ready'
      ? 'Kompass aktiv'
      : headingState === 'listening'
        ? 'Kompass wird abgehört …'
        : headingState === 'blocked'
          ? 'Kompass nicht verfügbar'
          : 'Kompass optional';

  return (
    <div className="poi-overlay">
      <div className="poi-toolbar">
        <button type="button" className="pill-button" onClick={() => onZoomChange(zoom - 0.1)}>
          -
        </button>
        <input
          className="zoom-range"
          type="range"
          min="0.8"
          max="1.5"
          step="0.05"
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          aria-label="Zoom für die Overlay-Ansicht"
        />
        <button type="button" className="pill-button" onClick={() => onZoomChange(zoom + 0.1)}>
          +
        </button>
      </div>

      <div className="geo-pill">
        {geoLabel} · {compassLabel}
      </div>

      <div className="poi-layer" style={{ transform: `scale(${zoom})` }}>
        {poiViews.map((poi) => {
          const isSelected = poi.id === selectedPoiId;
          return (
            <button
              key={poi.id}
              type="button"
              className={`poi-marker ${isSelected ? 'is-selected' : ''}`}
              style={{
                left: `${poi.left}%`,
                top: `${poi.top}%`,
                opacity: poi.opacity,
                transform: `translate(-50%, -50%) scale(${poi.scale})`,
              }}
              onClick={() => onSelectPoi(poi.id)}
              aria-label={`${poi.name} öffnen`}
            >
              <span className="poi-marker-icon">i</span>
              <span className="poi-marker-label">{poi.name}</span>
              <span className="poi-marker-distance">{poi.distanceLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

