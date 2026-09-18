import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Web-Code-Runner/',
  server:{
    proxy:{
      '/languages': 'http://localhost:3000',
      '/submissions': 'http://localhost:3000',
    }
  }
})
