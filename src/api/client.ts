import type { ApiError } from './types'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Erreur ${res.status}`
    try {
      const body = (await res.json()) as ApiError
      message = body.erreur ?? message
    } catch {
      message = `Erreur ${res.status}`
    }
    throw new ApiRequestError(res.status, message)
  }
  return (await res.json()) as T
}
