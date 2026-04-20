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

async function request<T>(method: HttpMethod, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    ...init
  })
  if (res.status === 204) return undefined as T
  const text = await res.text()
  const parsed = text ? JSON.parse(text) : {}
  if (!res.ok) {
    const err = (parsed?.error ?? { code: 'UNKNOWN', message: res.statusText }) as ApiError
    throw new ApiClientError(res.status, err)
  }
  return parsed as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, form: FormData) => request<T>('POST', path, form)
}
