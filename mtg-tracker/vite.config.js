import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // './' makes the built site work from any folder, e.g. GitHub Pages at /connectors/
  base: './',
  plugins: [react()],
})
