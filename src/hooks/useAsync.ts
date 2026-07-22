import { useCallback, useEffect, useRef, useState } from 'react'

export type AsyncStatus = 'loading' | 'error' | 'ready'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  retry: () => void
}

/** Estado loading/error/data para una promesa dependiente de `deps`. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ status: AsyncStatus; data: T | null }>({
    status: 'loading',
    data: null,
  })
  const [attempt, setAttempt] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null })
    fnRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', data: null })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])
  return { ...state, retry }
}
