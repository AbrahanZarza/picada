export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; promise: Promise<unknown> }>()

async function doFetch<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new ApiError(`HTTP ${res.status} for ${url}`, res.status)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

/**
 * fetch JSON con timeout, un reintento con backoff y caché en memoria
 * (evita repetir peticiones al navegar entre días o modalidades).
 */
export async function fetchJson<T>(url: string, { timeoutMs = 8000 } = {}): Promise<T> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.promise as Promise<T>
  }
  const promise = (async () => {
    try {
      return await doFetch<T>(url, timeoutMs)
    } catch (err) {
      // los errores 4xx no se reintentan: son estables (p.ej. marine en interior)
      if (err instanceof ApiError && err.status < 500) throw err
      await new Promise((r) => setTimeout(r, 800))
      return doFetch<T>(url, timeoutMs)
    }
  })()
  cache.set(url, { at: Date.now(), promise })
  promise.catch(() => cache.delete(url))
  return promise
}
