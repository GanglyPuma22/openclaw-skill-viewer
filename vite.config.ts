import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = 4173
const apiPort = 4174

export default defineConfig({
  plugins: [react()],
  server: {
    port,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
  },
})
