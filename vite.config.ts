import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
  react(),
  mode === "development" && componentTagger(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'FitTracker — Personal Trainer App',
      short_name: 'FitTracker',
      description: 'Gerencie agenda, treinos e resultados de alunos.',
      theme_color: '#7c3aed',
      background_color: '#0d0a1a',
      display: 'standalone',
      start_url: '/dashboard',
      lang: 'pt-BR',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
  })
].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
