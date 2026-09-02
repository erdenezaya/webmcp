import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { headers: { 'Origin-Agent-Cluster': '?1' } },
  preview: { headers: { 'Origin-Agent-Cluster': '?1' } },
})
