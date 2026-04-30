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

export function buildPoiView(poi, userPosition, heading = 0, index = 0, options = {}) {
  const {
    towerTopMode = false,
    towerCoords = null,
    towerHeightM = 20,
    towerFallbackRadiusM = 120,
  } = options;

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
      elevationAngleDegrees: null,
      altitudeSource: 'none',
      mode: 'fallback',
      distanceLabel: 'Testposition',
      markerRank: index,
    };
  }

  const distance = distanceMeters(userPosition, poi);
  const bearing = bearingDegrees(userPosition, poi);
  // Correct orientation: some devices report heading sign inverted. Use
  // heading - bearing so right turns map to rightward marker movement.
  const relativeAngle = normalizeRelativeAngle(heading - bearing);

  let userAltitude =
    typeof userPosition.altitude === 'number' && Number.isFinite(userPosition.altitude)
      ? userPosition.altitude
      : null;
  let altitudeSource = userAltitude == null ? 'none' : 'sensor';

  const distanceToTower =
    towerCoords && typeof towerCoords.latitude === 'number' && typeof towerCoords.longitude === 'number'
      ? distanceMeters(userPosition, towerCoords)
      : Infinity;

  if (towerTopMode && distanceToTower <= towerFallbackRadiusM) {
    userAltitude = towerHeightM;
    altitudeSource = 'tower-top-mode';
  }

  const poiAltitudeDefined = typeof poi.altitude === 'number' && Number.isFinite(poi.altitude);
  const canUseElevation = poiAltitudeDefined || altitudeSource === 'tower-top-mode';
  const poiAltitude = poiAltitudeDefined ? poi.altitude : 0;
  const elevationAngle =
    canUseElevation && userAltitude != null
      ? toDegrees(Math.atan2(poiAltitude - userAltitude, Math.max(distance, 1)))
      : null;

  const left = clamp(50 + (relativeAngle / 120) * 40, 8, 92);
  const distanceFactor = clamp(distance / 4000, 0, 1);
  const baselineTop = clamp(62 - distanceFactor * 28 + Math.abs(relativeAngle) / 24, 16, 84);
  const topFromElevation =
    elevationAngle == null ? baselineTop : clamp(52 - elevationAngle * 1.7 + Math.abs(relativeAngle) / 28, 12, 88);
  const top = clamp(baselineTop * 0.45 + topFromElevation * 0.55, 12, 88);
  const opacity = clamp(1 - distance / 12000, 0.45, 1);
  // Increase base scale so POIs are legible from a tower viewpoint.
  const scale = clamp(1.6 - distance / 6000, 0.9, 1.8);

  // Depth tuning for tower/overhead perspective.
  const z3d = clamp((2000 - distance) / 40, -400, 400);
  const scaleZ = clamp(1 - distance / 10000, 0.7, 1.08);
  const zIndex = Math.round((1 - distanceFactor) * 1000) + index;
  const blurAmount = clamp(distance / 8000, 0, 6);
  const baseMarkerPx = Math.round(clamp(56 * scale, 36, 96));

  return {
    ...poi,
    left,
    top,
    opacity,
    scale,
    baseMarkerPx,
    z3d,
    scaleZ,
    zIndex,
    blurAmount,
    distanceMeters: distance,
    bearingDegrees: bearing,
    relativeAngleDegrees: relativeAngle,
    elevationAngleDegrees: elevationAngle,
    altitudeSource,
    mode: 'geo',
    distanceLabel: formatDistanceMeters(distance),
    markerRank: index,
  };
}

