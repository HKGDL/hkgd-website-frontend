import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Only load HTTPS certs in development mode when they exist
  const certsPath = path.resolve(__dirname, './certs');
  const keyPath = path.join(certsPath, 'key.pem');
  const certPath = path.join(certsPath, 'cert.pem');
  const hasCerts = mode === 'development' && fs.existsSync(keyPath) && fs.existsSync(certPath);

  return {
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
      ...(hasCerts ? {
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath)
        }
      } : {}),
      allowedHosts: ['hkgdl.ddns.net', 'hkgdl.dpdns.org', 'localhost'],
      hmr: hasCerts ? {
        host: 'hkgdl.ddns.net',
        port: 5173,
        clientPort: 443,
        protocol: 'wss',
      } : undefined,
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
  };
});
