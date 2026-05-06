import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Troc et Survie',
        short_name: 'TrocSurvie',
        description:
          'Entraide locale : troc alimentaire, compétences et carte de proximité.',
        theme_color: '#1e3a2f',
        background_color: '#f4f1ea',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
})
