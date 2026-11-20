import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base = nome do repositório no GitHub (os arquivos ficam em /Zeon_GT-4.0/)
export default defineConfig({
  base: '/Zeon_GT-4.0/',
  plugins: [react()],
})
