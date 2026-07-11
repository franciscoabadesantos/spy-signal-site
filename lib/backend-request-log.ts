import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'

export type BackendRequestLogContext = {
  navigationMode: string
  requestId: string
  ticker: string
}

type BackendRequestLogEvent = {
  context: string
  durationMs: number
  endpoint: string
  error?: string
  status?: number | null
  timeout?: boolean
}

const storage = new AsyncLocalStorage<BackendRequestLogContext>()

export function backendRequestLogContext(): BackendRequestLogContext | null {
  return storage.getStore() ?? null
}

export function runWithBackendRequestLogContext<T>(
  context: BackendRequestLogContext,
  operation: () => T
): T {
  return storage.run(context, operation)
}

export function backendErrorDetails(error: unknown): {
  aborted: boolean
  message: string
  timeout: boolean
} {
  const name = error instanceof Error ? error.name : ''
  const message = error instanceof Error ? error.message : 'Unknown backend error'
  return {
    aborted: name === 'AbortError' || /abort/i.test(message),
    message,
    timeout: /timed out|timeout/i.test(message),
  }
}

export function logBackendRequestEvent(event: BackendRequestLogEvent): void {
  const requestContext = backendRequestLogContext()
  if (!requestContext) return

  const payload = {
    ticker: requestContext.ticker,
    requestId: requestContext.requestId,
    navigationMode: requestContext.navigationMode,
    endpoint: event.endpoint,
    context: event.context,
    status: event.status ?? null,
    durationMs: event.durationMs,
    error: event.error ?? null,
    timeout: event.timeout ?? false,
  }

  if (event.error || (event.status !== undefined && event.status !== null && event.status >= 400)) {
    console.error('[stock-backend]', payload)
    return
  }

  console.info('[stock-backend]', payload)
}
