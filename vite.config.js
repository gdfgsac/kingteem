import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // عشان يفتح معاك على الموبايل
    proxy: {
      '/api': {
        target: 'https://web-production-1c7b1.up.railway.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})