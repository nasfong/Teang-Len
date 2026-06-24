// Shared HTTP layer: base URL, JWT storage, and a fetch wrapper that attaches
// the Bearer token and centralises auth-error handling.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

const LS_TOKEN = 'tl_token';

// ─── JWT storage ───────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}
export function setToken(token: string): void {
  localStorage.setItem(LS_TOKEN, token);
}
export function clearToken(): void {
  localStorage.removeItem(LS_TOKEN);
}

// ─── Unauthorized hook ──────────────────────────────────────────────────────────
// authStore registers a handler so an expired/invalid token anywhere triggers a
// single, consistent logout — without services importing the store (no cycle).

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

// ─── Request helper ─────────────────────────────────────────────────────────────

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Network error — please check your connection.');
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error('Your session has expired. Please log in again.');
  }

  const body = (await res.json().catch(() => null)) as
    | { ok: boolean; data?: T; error?: string }
    | null;

  if (!body || !body.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}
