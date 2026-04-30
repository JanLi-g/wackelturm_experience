'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import CameraStage from '../components/CameraStage.js';
import Ar3DOverlay from '../components/Ar3DOverlay.js';
import {
  buildPoiView,
  distanceMeters,
  formatDistanceMeters,
  normalizeHeading,
  normalizeRelativeAngle,
} from '../lib/geo';
import {
  HEADING_SMOOTHING_ALPHA,
  TOWER_FALLBACK_RADIUS_M,
  WACKELTURM_COORDS,
  WACKELTURM_HEIGHT_M,
} from '../lib/arConfig';
import pois from '../lib/pois';

function smoothHeading(previous, next, alpha = HEADING_SMOOTHING_ALPHA) {
  const delta = normalizeRelativeAngle(next - previous);
  return normalizeHeading(previous + delta * alpha);
}

export default function ArPage() {
  const locationWatchRef = useRef(null);
  const [selectedPoiId, setSelectedPoiId] = useState(pois[0]?.id ?? null);
  const [geoState, setGeoState] = useState('idle');
  const [geoPosition, setGeoPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [rawHeading, setRawHeading] = useState(0);
  const [headingState, setHeadingState] = useState('idle');
  const [compassActive, setCompassActive] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [rotateHintDismissed, setRotateHintDismissed] = useState(false);

  const selectedPoi = useMemo(
    () => pois.find((poi) => poi.id === selectedPoiId) ?? pois[0],
    [selectedPoiId],
  );

  const selectedPoiView = useMemo(
    () =>
      buildPoiView(selectedPoi ?? pois[0], geoPosition, heading, 0, {
        towerTopMode: true,
        towerCoords: WACKELTURM_COORDS,
        towerHeightM: WACKELTURM_HEIGHT_M,
        towerFallbackRadiusM: TOWER_FALLBACK_RADIUS_M,
      }),
    [selectedPoi, geoPosition, heading],
  );

  const poiViews = useMemo(
    () =>
      pois.map((poi, index) =>
        buildPoiView(poi, geoPosition, heading, index, {
          towerTopMode: true,
          towerCoords: WACKELTURM_COORDS,
          towerHeightM: WACKELTURM_HEIGHT_M,
          towerFallbackRadiusM: TOWER_FALLBACK_RADIUS_M,
        }),
      ),
    [geoPosition, heading],
  );

  const distanceToTower = useMemo(() => {
    if (!geoPosition) {
      return null;
    }

    return distanceMeters(geoPosition, WACKELTURM_COORDS);
  }, [geoPosition]);

  useEffect(() => {
    if (!compassActive || typeof window === 'undefined') {
      return undefined;
    }

    const handleOrientation = (event) => {
      if (typeof event.webkitCompassHeading === 'number') {
        const nextHeading = normalizeHeading(event.webkitCompassHeading);
        setRawHeading(nextHeading);
        setHeading((previous) => smoothHeading(previous, nextHeading));
        setHeadingState('ready');
        return;
      }

      if (typeof event.alpha === 'number') {
        const nextHeading = normalizeHeading(360 - event.alpha);
        setRawHeading(nextHeading);
        setHeading((previous) => smoothHeading(previous, nextHeading));
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

  useEffect(() => {
    return () => {
      if (locationWatchRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const syncOrientation = () => setIsPortrait(mediaQuery.matches);

    syncOrientation();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncOrientation);
      return () => mediaQuery.removeEventListener('change', syncOrientation);
    }

    mediaQuery.addListener(syncOrientation);
    return () => mediaQuery.removeListener(syncOrientation);
  }, []);

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState('blocked');
      return;
    }

    if (locationWatchRef.current != null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }

    setGeoState('loading');
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGeoPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: Number.isFinite(position.coords.altitude) ? position.coords.altitude : null,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: Number.isFinite(position.coords.altitudeAccuracy)
            ? position.coords.altitudeAccuracy
            : null,
          speed: Number.isFinite(position.coords.speed) ? position.coords.speed : null,
        });
        setGeoState('ready');
      },
      () => {
        setGeoState('blocked');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000,
      },
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

      {isPortrait && !rotateHintDismissed ? (
        <button
          type="button"
          className="rotate-hint"
          onClick={() => setRotateHintDismissed(true)}
          aria-label="Hinweis schließen"
        >
          <span className="rotate-hint-icon" aria-hidden="true">↻</span>
          <span className="rotate-hint-text">Smartphone drehen für die AR-Ansicht</span>
        </button>
      ) : null}

      <CameraStage>
        <Ar3DOverlay
          poiViews={poiViews}
          selectedPoiId={selectedPoi?.id ?? null}
          onSelectPoi={setSelectedPoiId}
        />

        <aside className="ar-debug-panel" aria-label="AR Debug Werte">
          <p>Tower Distanz: {distanceToTower == null ? '—' : `${Math.round(distanceToTower)} m`}</p>
          <p>GPS Genauigkeit: {geoPosition?.accuracy ? `±${Math.round(geoPosition.accuracy)} m` : '—'}</p>
          <p>Altitude: {geoPosition?.altitude == null ? 'n/a' : `${geoPosition.altitude.toFixed(1)} m`}</p>
          <p>Heading raw/smooth: {Math.round(rawHeading)}° / {Math.round(heading)}°</p>
          <p>Alt-Quelle: {selectedPoiView?.altitudeSource ?? 'none'}</p>
        </aside>
      </CameraStage>

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
          {selectedPoiView?.elevationAngleDegrees != null ? (
            <span>Elevation: {selectedPoiView.elevationAngleDegrees.toFixed(1)}°</span>
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
          Kompass: {headingState === 'ready' ? `${Math.round(heading)}°` : headingState} · GPS: {geoState}
        </p>
      </aside>

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

