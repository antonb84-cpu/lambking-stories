import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: ['adminUI/**', 'node_modules/**', 'dist/**'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 120000,
    pool: 'forks'
  }
})
