import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base = nome do repositório no GitHub (os arquivos ficam em /Projeto_final/)
export default defineConfig({
  base: '/Projeto_final/',
  plugins: [react()],
})
