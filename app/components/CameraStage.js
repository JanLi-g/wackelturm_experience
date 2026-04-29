'use client';

import { useEffect, useRef, useState } from 'react';

export default function CameraStage({ children }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');

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

        {children}
      </div>

      {cameraError ? <p className="camera-error">{cameraError}</p> : null}
    </section>
  );
}

