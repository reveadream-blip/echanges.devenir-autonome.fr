import { createApi } from './app'
import type { Env } from './app'
import { sitemapXmlResponse } from './sitemap'
import { handleStripeWebhook } from './stripe-webhook'

const api = createApi()

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
      return env.ASSETS.fetch(request)
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
