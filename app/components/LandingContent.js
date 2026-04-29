'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';

export default function LandingContent() {
  const arUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return `${baseUrl.replace(/\/$/, '')}/ar`;
  }, []);

  return (
    <main className="page-shell landing-shell">
      <section className="landing-grid">
        <div className="landing-copy">
          <p className="eyebrow">Wackelturm Leipzig · Besucher-Start</p>
          <h1>Scannen, öffnen, Leipzig aus dem Turm erleben</h1>
          <p className="lead">
            Diese Seite ist für Besucher am Wackelturm gedacht. Der QR-Code öffnet
            die mobile AR-Ansicht, in der Kamera-Overlay, Standort und Sehenswürdigkeiten
            angezeigt werden.
          </p>

          <div className="landing-actions">
            <Link href="/ar" className="primary-button landing-button">
              AR-Ansicht öffnen
            </Link>
            <a className="pill-button landing-button" href={arUrl}>
              Direktlink kopieren
            </a>
          </div>

          <div className="landing-notes card">
            <h2>So funktioniert es vor Ort</h2>
            <ol>
              <li>QR-Code am Turm scannen.</li>
              <li>AR-Ansicht im Browser öffnen.</li>
              <li>Kamera und Standort erlauben.</li>
              <li>Marker und Mini-Map nutzen.</li>
            </ol>
          </div>
        </div>

        <aside className="qr-card card">
          <p className="poi-detail-kicker">QR-Code</p>
          <h2>Zur AR-Ansicht</h2>
          <div className="qr-code-box">
            <QRCode value={arUrl} size={220} bgColor="#ffffff" fgColor="#132238" />
          </div>
          <p className="qr-url">{arUrl}</p>
          <p className="qr-hint">
            Tipp: Setze später `NEXT_PUBLIC_SITE_URL`, damit der Code direkt auf deine
            öffentliche Domain zeigt.
          </p>
        </aside>
      </section>

      <section className="card-grid info-grid">
        <article className="card">
          <h2>Für Besucher</h2>
          <p>Eine kurze, klare Einstiegsseite statt direkt mit Sensoren zu starten.</p>
        </article>
        <article className="card">
          <h2>Für Entwicklung</h2>
          <p>Die AR-Logik liegt sauber unter <code>/ar</code> und bleibt getrennt.</p>
        </article>
        <article className="card">
          <h2>Für später</h2>
          <p>Der QR-Code kann auf eine echte Domain, Kampagne oder Stadtseite zeigen.</p>
        </article>
      </section>
    </main>
  );
}

