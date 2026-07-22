import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { GeoPoint } from '../../types'
import 'leaflet/dist/leaflet.css'

const pinIcon = divIcon({
  className: 'pin-marker',
  html: '<div class="pin-dot"></div><div class="pin-stem"></div>',
  iconSize: [26, 34],
  iconAnchor: [13, 32],
})

function ClickHandler({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
  })
  return null
}

interface Props {
  point: GeoPoint | null
  onPick: (p: GeoPoint) => void
}

export default function LocationMap({ point, onPick }: Props) {
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (point && mapRef.current) {
      mapRef.current.setView([point.lat, point.lon], Math.max(mapRef.current.getZoom(), 9), {
        animate: true,
      })
    }
  }, [point])

  return (
    <MapContainer
      ref={mapRef}
      center={point ? [point.lat, point.lon] : [40.0, -4.0]}
      zoom={point ? 9 : 5}
      className="location-map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      {point && <Marker position={[point.lat, point.lon]} icon={pinIcon} />}
    </MapContainer>
  )
}
