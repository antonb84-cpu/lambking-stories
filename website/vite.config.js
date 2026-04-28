import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
// In dev we proxy `/api` to lbs-be so the browser sees a same-origin request
// and CORS doesn't apply. The deployed website should set
// `VITE_API_BASE_URL` to the absolute lbs-be URL — and that origin must be
// added to the server's CORS_ORIGIN allow-list.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const proxyTarget = env.VITE_API_PROXY_TARGET || 'https://lbs-be.onrender.com';
    return {
        plugins: [vue(), tailwindcss()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            port: 2099,
            strictPort: true,
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: true
                }
            }
        },
        preview: {
            port: 2099
        }
    };
});
