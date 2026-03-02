import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    // Tailwind v4 via its dedicated Vite plugin (no tailwind.config.js needed)
    tailwindcss(),
  ],
})
