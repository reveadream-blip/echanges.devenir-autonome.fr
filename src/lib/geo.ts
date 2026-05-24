const KEY = 'troc-survie-viewer'

export function getViewerCoords(): { lat: number; lng: number } | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const j = JSON.parse(raw) as { lat?: unknown; lng?: unknown }
    if (typeof j.lat === 'number' && typeof j.lng === 'number') {
      return { lat: j.lat, lng: j.lng }
    }
    return null
  } catch {
    return null
  }
}

export function setViewerCoords(lat: number, lng: number) {
  sessionStorage.setItem(KEY, JSON.stringify({ lat, lng }))
}

export function clearViewerCoords() {
  sessionStorage.removeItem(KEY)
}

/** Query pour les endpoints qui acceptent viewer_lat / viewer_lng */
export function viewerQueryPrefix(): string {
  const v = getViewerCoords()
  if (!v) return ''
  return `viewer_lat=${encodeURIComponent(v.lat)}&viewer_lng=${encodeURIComponent(v.lng)}`
}
