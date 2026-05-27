import { createApi } from './app'
import type { Env } from './app'
import { sitemapXmlResponse } from './sitemap'
import { handleStripeWebhook } from './stripe-webhook'

const api = createApi()

/** Fichier statique manquant → index.html pour le routeur React (si run_worker_first couvre la route). */
async function serveAssets(request: Request, assets: Fetcher): Promise<Response> {
  const response = await assets.fetch(request)
  if (response.status !== 404 || (request.method !== 'GET' && request.method !== 'HEAD')) {
    return response
  }

  const path = new URL(request.url).pathname
  if (path.startsWith('/api') || /\.[a-zA-Z0-9]+$/.test(path)) {
    return response
  }

  const indexRequest = new Request(new URL('/index.html', request.url), request)
  return assets.fetch(indexRequest)
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    void ctx
    const url = new URL(request.url)
    if (url.pathname === '/sitemap.xml' && request.method === 'GET') {
      return sitemapXmlResponse(env)
    }
    if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
      return handleStripeWebhook(request, env)
    }
    if (url.pathname.startsWith('/api')) {
      return api.fetch(request, env, ctx)
    }
    if (env.ASSETS) {
      return serveAssets(request, env.ASSETS)
    }
    return new Response(
      'Frontend non compilé — exécutez npm run build ou utilisez Vite en dev (proxy /api).',
      {
        status: 503,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      },
    )
  },
}
