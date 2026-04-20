import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  // Default: proxy dev requests to the hosted Render backend so uploads land
  // on the single shared filesystem. Override with `VITE_API_TARGET=http://localhost:4000`
  // in `server/.env.local` when you actually want to hit the local server.
  const target = env.VITE_API_TARGET || 'https://lbs-be.onrender.com'
  const isHttps = target.startsWith('https://')

  return {
    base: '/admin/',
    plugins: [vue(), tailwind()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port: 4344,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: isHttps,
          configure: (proxy) => {
            // Present the proxied request to the backend with its own origin
            // so the server's CORS allowlist accepts it without whitelisting
            // http://localhost:4344.
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', target)
            })
          }
        },
        '/audiobooks': { target, changeOrigin: true, secure: isHttps },
        '/uploads': { target, changeOrigin: true, secure: isHttps }
      }
    },
    build: {
      outDir: '../public/admin',
      emptyOutDir: true,
      sourcemap: true
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts']
    }
  }
})
