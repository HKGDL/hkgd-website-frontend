import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8081,
    host: '0.0.0.0',
    strictPort: false,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    },
    allowedHosts: ['hkgdl.ddns.net', 'localhost', '.ddns.net'],
    hmr: {
      host: 'hkgdl.ddns.net',
      port: 8081,
      clientPort: 8081,
      protocol: 'wss', // Use secure WebSocket for HTTPS
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'https://localhost:19132', // Use HTTPS backend on port 19132
        changeOrigin: true,
        secure: false, // Accept self-signed certificates in development
      }
    }
  }
});
