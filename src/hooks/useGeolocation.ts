import { useCallback, useState } from 'react'
import type { GeoPoint } from '../types'

export type GeoStatus = 'idle' | 'locating' | 'done' | 'denied' | 'error'

export function useGeolocation(): {
  status: GeoStatus
  point: GeoPoint | null
  locate: () => void
} {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [point, setPoint] = useState<GeoPoint | null>(null)

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('error')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus('done')
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  return { status, point, locate }
}
