import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@baby-yak/service-loom-js': resolve(__dirname, '../../packages/service-loom-js/src/index.ts'),
      '@baby-yak/service-loom-react': resolve(__dirname, '../../packages/service-loom-react/src/index.ts'),
    },
  },
})
