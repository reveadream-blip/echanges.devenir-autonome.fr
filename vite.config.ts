import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function escapeHtmlAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const googleSiteVerification = env.VITE_GOOGLE_SITE_VERIFICATION

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
        // Sitemap servi par le Worker — avec npm run dev + dev:worker, évite que Vite renvoie index.html
        '/sitemap.xml': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      {
        name: 'inject-google-site-verification',
        transformIndexHtml(html) {
          if (!googleSiteVerification) return html
          const tag = `<meta name="google-site-verification" content="${escapeHtmlAttr(googleSiteVerification)}" />`
          return html.replace('</head>', `  ${tag}\n  </head>`)
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: 'TROC',
          short_name: 'TROC',
          description:
            'Entraide locale : troc alimentaire, compétences et carte de proximité.',
          theme_color: '#141f1a',
          background_color: '#141f1a',
          display: 'standalone',
          orientation: 'portrait',
          lang: 'fr',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          // Pas de NavigationRoute vers index.html : sinon le SW intercepte /sitemap.xml (et robots.txt)
          // et affiche l’app comme pour une SPA. Les pages sont déjà servies en ligne par le Worker.
          navigateFallback: null,
        },
      }),
    ],
  }
})
