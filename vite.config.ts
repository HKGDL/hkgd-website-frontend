import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base for flexibility in deployment
  base: '/',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production build settings
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './certs/cert.pem'))
    },
    allowedHosts: ['hkgdl.ddns.net', 'hkgdl.dpdns.org', 'localhost'],
    hmr: {
      host: 'hkgdl.ddns.net',
      port: 5173,
      clientPort: 443,
      protocol: 'wss',
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Preview server for testing production build locally
  preview: {
    port: 4173,
    host: '0.0.0.0',
  }
});
