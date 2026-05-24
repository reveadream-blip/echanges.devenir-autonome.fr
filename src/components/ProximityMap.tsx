import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Circle, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  clearViewerCoords,
  setViewerCoords,
  viewerQueryPrefix,
} from '../lib/geo'
import type { MapMarker } from '../types/api'

function MoveCenter({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, Math.max(map.getZoom(), 10), { animate: true })
  }, [center, map])
  return null
}

export default function ProximityMap() {
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [center, setCenter] = useState<LatLngExpression>([46.5, 2.5])
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function run() {
      const q = viewerQueryPrefix()
      const path = q ? `/api/map/markers?${q}` : '/api/map/markers'
      try {
        const r = await fetch(path, { credentials: 'include' })
        const data = (await r.json()) as {
          markers: MapMarker[]
          center: { lat: number; lng: number }
        }
        if (cancelled) return
        setMarkers(data.markers ?? [])
        setCenter([data.center.lat, data.center.lng])
      } catch {
        if (!cancelled) setMarkers([])
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [nonce])

  function locate() {
    if (!navigator.geolocation) return
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setViewerCoords(pos.coords.latitude, pos.coords.longitude)
        setBusy(false)
        setNonce((n) => n + 1)
      },
      () => setBusy(false),
      { enableHighAccuracy: false, timeout: 12_000 },
    )
  }

  function clearLocalViewer() {
    clearViewerCoords()
    setNonce((n) => n + 1)
  }

  return (
    <div className="map-shell stack-lg">
      <div className="hero-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={locate}
          disabled={busy}
        >
          {busy ? 'Localisation…' : 'Utiliser ma position (navigateur)'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={clearLocalViewer}
        >
          Effacer ma position locale
        </button>
      </div>

      <p className="small muted">
        Cercles d’environ 850 m autour de coordonnées <strong>arrondies</strong>{' '}
        (~1,1 km) — pas d’adresse exacte.
      </p>

      <MapContainer
        center={center}
        zoom={11}
        className="leaflet-map"
        scrollWheelZoom
      >
        <MoveCenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Circle
            key={`${m.kind}-${m.id}`}
            center={[m.approx_lat, m.approx_lng]}
            radius={m.radius_m}
            pathOptions={{
              color: m.kind === 'food' ? '#2f6f4e' : '#1f3d7a',
              fillOpacity: 0.16,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {m.label} — {m.zone_label}
            </Tooltip>
            <Popup>
              <div className="map-marker-popup">
                <strong>{m.label}</strong>
                <p className="small muted">{m.zone_label}</p>
                <Link
                  className="map-marker-popup__link"
                  to={m.kind === 'food' ? `/troc/${m.id}` : `/competences/${m.id}`}
                >
                  Voir l’annonce
                </Link>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  )
}
