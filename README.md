# Wackelturm AR Prototype

Next.js-MVP für den Wackelturm in Leipzig.

## Routen

- `/` = Besucher-Landingpage mit QR-Code
- `/ar` = mobile Kamera-/AR-Ansicht

## Starten

```bash
npm install
npm run dev
```

Dann im Browser öffnen:

```bash
http://localhost:3000
```

## QR-Code-Ziel

Die Landingpage ermittelt die Domain automatisch aus dem Request und setzt den
QR-Code auf `https://<deine-domain>/ar` (lokal: `http://localhost:3000/ar`).

## Nächste Ausbaupunkte

- echte Geodaten statt Testdaten
- bessere Kompass-Kalibrierung
- Info-Modal pro Sehenswürdigkeit
- Stadt- oder CMS-Anbindung für Inhalte

