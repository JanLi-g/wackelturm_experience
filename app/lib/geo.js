const EARTH_RADIUS_METERS = 6371000;

export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

export function normalizeHeading(degrees) {
  return ((degrees % 360) + 360) % 360;
}

export function normalizeRelativeAngle(degrees) {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function distanceMeters(from, to) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingDegrees(from, to) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return normalizeHeading(toDegrees(Math.atan2(y, x)));
}

export function formatDistanceMeters(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  }

  return `${Math.round(value)} m`;
}

export function buildPoiView(poi, userPosition, heading = 0, index = 0) {
  if (!userPosition) {
    return {
      ...poi,
      left: poi.screenX ?? 50,
      top: poi.screenY ?? 50,
      opacity: 1,
      scale: 1,
      distanceMeters: null,
      bearingDegrees: null,
      relativeAngleDegrees: null,
      mode: 'fallback',
      distanceLabel: 'Testposition',
      markerRank: index,
    };
  }

  const distance = distanceMeters(userPosition, poi);
  const bearing = bearingDegrees(userPosition, poi);
  const relativeAngle = normalizeRelativeAngle(bearing - heading);

  const left = clamp(50 + (relativeAngle / 120) * 40, 8, 92);
  const distanceFactor = clamp(distance / 4000, 0, 1);
  const top = clamp(62 - distanceFactor * 28 + Math.abs(relativeAngle) / 24, 18, 78);
  const opacity = clamp(1 - distance / 12000, 0.45, 1);
  const scale = clamp(1.1 - distance / 15000, 0.78, 1.08);

  const z3d = clamp((4000 - distance) / 100, -400, 400);
  const scaleZ = clamp(1 - distance / 12000, 0.5, 1);
  const zIndex = Math.round((1 - distanceFactor) * 1000) + index;
  const blurAmount = clamp(distance / 5000, 0, 8);

  return {
    ...poi,
    left,
    top,
    opacity,
    scale,
    z3d,
    scaleZ,
    zIndex,
    blurAmount,
    distanceMeters: distance,
    bearingDegrees: bearing,
    relativeAngleDegrees: relativeAngle,
    mode: 'geo',
    distanceLabel: formatDistanceMeters(distance),
    markerRank: index,
  };
}

