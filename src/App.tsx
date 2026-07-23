import { useState } from 'react'
import { LocationScreen } from './components/location/LocationScreen'
import { Dashboard } from './components/dashboard/Dashboard'
import { useLocalStorage } from './hooks/useLocalStorage'
import { STORAGE_KEYS } from './config'
import { isValidGeoPoint } from './lib/geo'
import type { GeoPoint } from './types'

export default function App() {
  const [stored, setLocation] = useLocalStorage<GeoPoint | null>(STORAGE_KEYS.location, null)
  // descarta una ubicación persistida corrupta (localStorage manipulado)
  const location = isValidGeoPoint(stored) ? stored : null
  const [picking, setPicking] = useState(location == null)

  if (picking || !location) {
    return (
      <LocationScreen
        initial={location}
        onConfirm={(p) => {
          setLocation(p)
          setPicking(false)
        }}
      />
    )
  }

  return <Dashboard point={location} onChangeLocation={() => setPicking(true)} />
}
