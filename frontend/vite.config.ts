import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const authEmailEnabled = rootEnv.APP_AUTH_EMAIL_ENABLED !== 'false'

  return {
    define: {
      __APP_AUTH_EMAIL_ENABLED__: JSON.stringify(authEmailEnabled),
    },
    plugins: [react(), tailwindcss()],

    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    preview: {
      host: true,
      allowedHosts: true,
    },
  }
})
