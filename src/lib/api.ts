function errorFromResponse(status: number, payload: unknown, rawText: string): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as { error?: unknown }).error === 'string'
  ) {
    return (payload as { error: string }).error
  }
  if (rawText && rawText.length < 280) {
    return `Erreur serveur (${status}) : ${rawText.trim()}`
  }
  if (status === 404) {
    return 'Ressource introuvable (404).'
  }
  if (status === 0 || status >= 500) {
    return `Serveur temporairement indisponible (${status || 'réseau'}). Réessayez dans un instant.`
  }
  return `Échec de la requête (${status}).`
}

async function apiFetchJson<T>(
  path: string,
  init: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const headers = new Headers(init.headers)
  if (
    init.body !== undefined &&
    init.body !== null &&
    !(typeof init.body === 'string' && init.body === '')
  ) {
    headers.set('Content-Type', 'application/json')
  }

  let r: Response
  try {
    r = await fetch(path, {
      credentials: 'include',
      ...init,
      headers,
    })
  } catch {
    return {
      ok: false,
      status: 0,
      message:
        'Connexion impossible. Vérifiez le réseau, ou que le site est bien ouvert en HTTPS sur le bon domaine.',
    }
  }

  const rawText = await r.text()
  let payload: unknown = null
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as unknown
    } catch {
      payload = null
    }
  }

  if (!r.ok) {
    return {
      ok: false,
      status: r.status,
      message: errorFromResponse(r.status, payload, rawText),
    }
  }
  return { ok: true, data: payload as T }
}

export async function apiGetJson<T>(
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  return apiFetchJson<T>(path, { method: 'GET' })
}

export async function apiPostJson<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  return apiFetchJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function apiPatchJson<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  return apiFetchJson<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function apiDeleteJson(
  path: string,
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; message: string }> {
  return apiFetchJson<unknown>(path, { method: 'DELETE' })
}
