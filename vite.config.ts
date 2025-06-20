import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A atualização será automática, sem pop-up para o usuário.
      registerType: "autoUpdate",

      // Gera o manifesto automaticamente. Não precisa ter um na pasta /public.
      manifest: {
        name: "Tryla",
        short_name: "Tryla",
        description: "Sua plataforma gamificada de aprendizado.",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icons/icon-192-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },

      // Usaremos a estratégia 'generateSW', que cria o sw.js para nós.
      workbox: {
        // Arquivos essenciais que o Workbox vai colocar em cache automaticamente.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],

        // IMPORTANTE: Aqui nós importamos nosso script com a lógica de PUSH.
        // O Workbox vai garantir que este script seja carregado e executado.
        importScripts: ["push-sw.js"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
