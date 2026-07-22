import { useCallback, useState } from 'react'
import { storageGet, storageSet } from '../lib/storage'

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => storageGet(key, fallback))

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        storageSet(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
