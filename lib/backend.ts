import 'server-only'

export class BackendDataError extends Error {
  readonly context: string
  readonly status: number | null

  constructor(context: string, message: string, status: number | null = null) {
    super(message)
    this.name = 'BackendDataError'
    this.context = context
    this.status = status
  }
}

export function backendBaseUrl(): string {
  const raw = process.env.FINANCE_BACKEND_URL || ''
  return raw.trim().replace(/\/+$/, '')
}

export function backendSharedSecret(): string {
  return (process.env.BACKEND_SHARED_SECRET || '').trim()
}

export function backendConfigSnapshot(): {
  hasFinanceBackendUrl: boolean
  hasBackendSharedSecret: boolean
} {
  return {
    hasFinanceBackendUrl: backendBaseUrl().length > 0,
    hasBackendSharedSecret: backendSharedSecret().length > 0,
  }
}

export function backendHeaders(
  options: {
    includeContentType?: boolean
    headers?: HeadersInit
  } = {}
): HeadersInit {
  const headers: Record<string, string> = {
    accept: 'application/json',
  }
  if (options.includeContentType) {
    headers['content-type'] = 'application/json'
  }

  const secret = backendSharedSecret()
  if (secret) headers['x-backend-shared-secret'] = secret

  return {
    ...headers,
    ...(options.headers ?? {}),
  }
}

async function withTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  context: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(
      () => reject(new BackendDataError(context, `${context} timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  })

  try {
    return await Promise.race([Promise.resolve(operation), timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function fetchBackendJson<T>(
  path: string,
  {
    context,
    timeoutMs = 9000,
    init,
    allowEmptyBody = false,
  }: {
    context: string
    timeoutMs?: number
    init?: RequestInit
    allowEmptyBody?: boolean
  }
): Promise<T> {
  const base = backendBaseUrl()
  if (!base) {
    throw new BackendDataError(context, 'FINANCE_BACKEND_URL is not configured')
  }

  let response: Response
  try {
    response = await withTimeout(
      fetch(`${base}${path}`, {
        cache: 'no-store',
        ...init,
        headers: backendHeaders({
          includeContentType: init?.body !== undefined,
          headers: init?.headers,
        }),
      }),
      timeoutMs,
      context
    )
  } catch (error) {
    if (error instanceof BackendDataError) throw error
    throw new BackendDataError(
      context,
      error instanceof Error ? error.message : 'Unknown backend fetch failure'
    )
  }

  if (!response.ok) {
    throw new BackendDataError(context, `${context} failed with status ${response.status}`, response.status)
  }

  try {
    const text = await response.text()
    if (!text.trim()) {
      if (allowEmptyBody) return null as T
      throw new Error('Empty backend response body')
    }
    return JSON.parse(text) as T
  } catch (error) {
    throw new BackendDataError(
      context,
      error instanceof Error ? error.message : 'Invalid backend JSON response',
      response.status
    )
  }
}
