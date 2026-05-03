import { useServerStatusStore } from '@/stores/serverStatus'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiError {
  code: string
  message: string
  details?: Array<{ field: string; message: string }>
}

export class ApiClientError extends Error {
  code: string
  status: number
  details?: ApiError['details']

  constructor(status: number, err: ApiError) {
    super(err.message)
    this.status = status
    this.code = err.code
    this.details = err.details
  }
}

// 502/503/504 (and a TypeError thrown by fetch on a broken connection) are
// the signatures of an unreachable backend. We treat all of them as "server
// down" and let the serverStatus store surface the banner + queue retries.
const OFFLINE_STATUSES = new Set([502, 503, 504])

function isOfflineFetchError(err: unknown): boolean {
  return err instanceof TypeError
}

async function performRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...init
  })
  if (OFFLINE_STATUSES.has(res.status)) {
    const err = new ApiClientError(res.status, { code: 'OFFLINE', message: res.statusText })
    ;(err as ApiClientError & { __offline: true }).__offline = true
    throw err
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const parsed = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const err = (parsed?.error ?? { code: 'UNKNOWN', message: res.statusText }) as ApiError
    throw new ApiClientError(res.status, err)
  }
  return parsed as T
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  try {
    return await performRequest<T>(method, path, body, init)
  } catch (err) {
    const isOffline =
      isOfflineFetchError(err) || (err as ApiClientError & { __offline?: true })?.__offline === true
    if (!isOffline) throw err
    // Mark the server down and park this request until /healthz comes back.
    // The promise we return here only resolves when the queued retry
    // succeeds (or the retry itself errors out for an unrelated reason),
    // so callers transparently keep their async-await flow.
    const status = useServerStatusStore()
    status.markDown()
    return new Promise<T>((resolve, reject) => {
      status.enqueueRetry(async () => {
        try {
          resolve(await performRequest<T>(method, path, body, init))
        } catch (retryErr) {
          reject(retryErr)
        }
      })
    })
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form)
}
