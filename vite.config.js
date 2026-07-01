import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    // Isto força o projeto a usar apenas UMA cópia do React, resolvendo o erro do Lucide
    dedupe: ['react', 'react-dom']
  }
})