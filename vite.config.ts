import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Adicione esta linha para permitir o host do Replit
    allowedHosts: [
      "54ee562d-d8ba-478f-8cbf-6450c0bdeb98-00-3m073qg923y6y.riker.replit.dev",
    ],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),

    // Configuração do PWA
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: false, // Diz ao plugin para não gerar um manifesto, pois já temos o nosso em /public
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        importScripts: ["custom-sw.js"],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
