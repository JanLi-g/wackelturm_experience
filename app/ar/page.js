'use client';

import { useEffect, useMemo, useState } from 'react';
import CameraStage from '../components/CameraStage.js';
import Ar3DOverlay from '../components/Ar3DOverlay.js';
import { buildPoiView, formatDistanceMeters, normalizeHeading } from '../lib/geo';
import pois from '../lib/pois';

export default function ArPage() {
  const [selectedPoiId, setSelectedPoiId] = useState(pois[0]?.id ?? null);
  const [geoState, setGeoState] = useState('idle');
  const [geoPosition, setGeoPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [headingState, setHeadingState] = useState('idle');
  const [compassActive, setCompassActive] = useState(false);

  const selectedPoi = useMemo(
    () => pois.find((poi) => poi.id === selectedPoiId) ?? pois[0],
    [selectedPoiId],
  );

  const selectedPoiView = useMemo(
    () => buildPoiView(selectedPoi ?? pois[0], geoPosition, heading),
    [selectedPoi, geoPosition, heading],
  );

  const poiViews = useMemo(
    () => pois.map((poi, index) => buildPoiView(poi, geoPosition, heading, index)),
    [geoPosition, heading],
  );

  useEffect(() => {
    if (!compassActive || typeof window === 'undefined') {
      return undefined;
    }

    const handleOrientation = (event) => {
      if (typeof event.webkitCompassHeading === 'number') {
        setHeading(normalizeHeading(event.webkitCompassHeading));
        setHeadingState('ready');
        return;
      }

      if (typeof event.alpha === 'number') {
        setHeading(normalizeHeading(360 - event.alpha));
        setHeadingState('ready');
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    setHeadingState('listening');

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [compassActive]);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState('blocked');
      return;
    }

    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoState('ready');
      },
      () => {
        setGeoState('blocked');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function requestCompass() {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setHeadingState('blocked');
      return;
    }

    try {
      if (typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
        const response = await window.DeviceOrientationEvent.requestPermission();
        if (response !== 'granted') {
          setHeadingState('blocked');
          setCompassActive(false);
          return;
        }
      }

      setCompassActive(true);
      setHeadingState('listening');
    } catch {
      setHeadingState('blocked');
      setCompassActive(false);
    }
  }

  return (
    <main className="page-shell ar-page">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Wackelturm Leipzig · AR MVP</p>
          <h1>AR-Overlay für Sehenswürdigkeiten</h1>
        </div>

        <div className="action-group">
          <button type="button" className="primary-button" onClick={requestLocation}>
            Standort aktivieren
          </button>
          <button type="button" className="pill-button" onClick={requestCompass}>
            Kompass aktivieren
          </button>
        </div>
      </header>

      <p className="lead hero-copy">
        Dies ist der erste mobile Prototyp: Kamera im Browser, Test-POIs mit
        Info-Icons und ein leichtes Overlay für spätere Geo-AR-Logik.
      </p>

      <CameraStage>
        <Ar3DOverlay
          poiViews={poiViews}
          selectedPoiId={selectedPoi?.id ?? null}
          onSelectPoi={setSelectedPoiId}
        />

        <aside className="poi-detail-panel">
          <p className="poi-detail-kicker">Ausgewählte Sehenswürdigkeit</p>
          <h2>{selectedPoi?.name}</h2>
          <p>{selectedPoi?.description}</p>

          <div className="poi-meta">
            <span>Lat: {selectedPoi?.latitude}</span>
            <span>Lng: {selectedPoi?.longitude}</span>
            {selectedPoiView?.distanceMeters != null ? (
              <span>Entfernung: {formatDistanceMeters(selectedPoiView.distanceMeters)}</span>
            ) : null}
            {selectedPoiView?.bearingDegrees != null ? (
              <span>Bearing: {Math.round(selectedPoiView.bearingDegrees)}°</span>
            ) : null}
          </div>

          {geoPosition ? (
            <p className="geo-readout">
              Dein Standort: {geoPosition.latitude.toFixed(5)}, {geoPosition.longitude.toFixed(5)}
            </p>
          ) : (
            <p className="geo-readout">Standortdaten werden später für echte Geo-AR genutzt.</p>
          )}

          <p className="geo-readout">
            Kompass: {headingState === 'ready' ? `${Math.round(heading)}°` : headingState}
          </p>
        </aside>
      </CameraStage>

      <section className="card-grid info-grid">
        <article className="card">
          <h2>Phase 1</h2>
          <p>3D-AR-Overlay mit perspektivischer Tiefe über der Kamera.</p>
        </article>
        <article className="card">
          <h2>Phase 2</h2>
          <p>Echte ARCore/ARKit Integration für präzise Verfolgung.</p>
        </article>
        <article className="card">
          <h2>Phase 3</h2>
          <p>Echte Leipziger Inhalte, Pflege, Mehrsprachigkeit und Skalierung.</p>
        </article>
      </section>
    </main>
  );
}

