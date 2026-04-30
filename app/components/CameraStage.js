'use client';

import { useEffect, useRef, useState } from 'react';

const MIN_ZOOM = 0.85;
const MAX_ZOOM = 1.9;
const ZOOM_STEP = 0.12;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function CameraStage({ children }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const zoomSurfaceRef = useRef(null);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [overlayZoom, setOverlayZoom] = useState(1);

  function updateZoom(nextZoom) {
    setOverlayZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  }

  function updateZoomBy(delta) {
    setOverlayZoom((currentZoom) => clamp(currentZoom + delta, MIN_ZOOM, MAX_ZOOM));
  }

  function handleWheel(event) {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    updateZoomBy(direction * ZOOM_STEP);
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse') {
      return;
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchRef.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        zoom: overlayZoom,
      };
    }
  }

  function handlePointerMove(event) {
    if (!pointersRef.current.has(event.pointerId)) {
      return;
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size < 2 || !pinchRef.current || pinchRef.current.distance <= 0) {
      return;
    }

    event.preventDefault();
    const [first, second] = [...pointersRef.current.values()];
    const currentDistance = Math.hypot(second.x - first.x, second.y - first.y);
    updateZoom(pinchRef.current.zoom * (currentDistance / pinchRef.current.distance));
  }

  function clearPointer(event) {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('unsupported');
        setCameraError('Dieses Gerät unterstützt keinen Kamera-Zugriff im Browser.');
        return;
      }

      try {
        setCameraStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStatus('ready');
        setCameraError('');
      } catch (error) {
        setCameraStatus('blocked');
        setCameraError('Kamera wurde blockiert oder abgelehnt. Bitte Berechtigung erlauben.');
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    const isAllowedTarget = (target) => {
      if (!(target instanceof Element)) {
        return false;
      }

      return Boolean(target.closest('[data-camera-zoom-allowed="true"]'));
    };

    const handleTouchMove = (event) => {
      if (event.touches.length < 2 || isAllowedTarget(event.target)) {
        return;
      }

      event.preventDefault();
    };

    const handleGesture = (event) => {
      if (isAllowedTarget(event.target)) {
        return;
      }

      event.preventDefault();
    };

    const handleWheelZoom = (event) => {
      if (!event.ctrlKey || isAllowedTarget(event.target)) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('gesturestart', handleGesture, { passive: false });
    document.addEventListener('gesturechange', handleGesture, { passive: false });
    document.addEventListener('wheel', handleWheelZoom, { passive: false });

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('gesturestart', handleGesture);
      document.removeEventListener('gesturechange', handleGesture);
      document.removeEventListener('wheel', handleWheelZoom);
    };
  }, []);

  useEffect(() => {
    const surface = zoomSurfaceRef.current;
    if (!surface) {
      return undefined;
    }

    surface.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      surface.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <section className="camera-stage" aria-label="Kameraansicht mit AR-Overlay">
      <div className="camera-frame">
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          muted
          playsInline
        />

        <div className="camera-overlay-grid" />

        <div className="camera-status-badge">
          {cameraStatus === 'ready' && 'Kamera aktiv'}
          {cameraStatus === 'requesting' && 'Kamera wird gestartet …'}
          {cameraStatus === 'blocked' && 'Kamera nicht verfügbar'}
          {cameraStatus === 'unsupported' && 'Keine Kamerafunktion'}
          {cameraStatus === 'idle' && 'Kamera wird vorbereitet …'}
        </div>

        <div
          ref={zoomSurfaceRef}
          className="camera-zoom-surface"
          data-camera-zoom-allowed="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={clearPointer}
          onPointerCancel={clearPointer}
        >
          <div className="camera-zoom-layer" style={{ transform: `scale(${overlayZoom})` }}>
            {children}
          </div>

          <div className="camera-zoom-controls" aria-label="Zoom-Steuerung">
            <button
              type="button"
              className="camera-zoom-button"
              onClick={() => updateZoomBy(ZOOM_STEP)}
              aria-label="Overlay vergrößern"
            >
              +
            </button>
            <button
              type="button"
              className="camera-zoom-button"
              onClick={() => updateZoomBy(-ZOOM_STEP)}
              aria-label="Overlay verkleinern"
            >
              -
            </button>
          </div>
        </div>
      </div>

      {cameraError ? <p className="camera-error">{cameraError}</p> : null}
    </section>
  );
}

