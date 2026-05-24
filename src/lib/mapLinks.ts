/** Liens Google Maps — utilise les coordonnées **approximatives** déjà publiques (~100 m). */

export function googleMapsDirectionsUrl(lat: number, lng: number): string {
  const dest = `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&hl=fr`
}

/** Ouvre Google Maps centré sur la rue la plus proche (Street View / Pegman). */
export function googleStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?layer=c&cbll=${lat},${lng}&hl=fr`
}

export function googleMapsEmbedUrl(lat: number, lng: number, zoom = 13): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed&hl=fr`
}
