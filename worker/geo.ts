/** Arrondi ~1,1 km — coordonnées publiques uniquement */
export function snapLatLng(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
  }
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function zoneLabel(
  viewerLat: number | undefined,
  viewerLng: number | undefined,
  snapLat: number,
  snapLng: number,
): string {
  if (
    viewerLat == null ||
    viewerLng == null ||
    Number.isNaN(viewerLat) ||
    Number.isNaN(viewerLng)
  ) {
    return 'Zone approximative (~1 km)'
  }
  const km = haversineKm(viewerLat, viewerLng, snapLat, snapLng)
  return `~${Math.max(1, Math.round(km))} km`
}
