import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Configuração do servidor de desenvolvimento
  server: {
    host: "::",
    port: 8080,
    // A linha `allowedHosts` é geralmente para ambientes específicos como Replit/CodeSandbox.
    // Pode ser removida se você desenvolve apenas localmente.
    allowedHosts: [
      "54ee562d-d8ba-478f-8cbf-6450c0bdeb98-00-3m073qg923y6y.riker.replit.dev",
    ],
  },

  // Configuração dos plugins
  plugins: [
    react(),

    // Plugin 'lovable-tagger', ativo apenas em modo de desenvolvimento
    mode === "development" && componentTagger(),

    // Configuração do PWA usando a estratégia 'injectManifest'
    VitePWA({
      // 'autoUpdate' irá atualizar o service worker automaticamente no navegador do usuário.
      registerType: "autoUpdate",

      // Especifica que vamos usar nosso próprio service worker como base.
      injectManifest: {
        // Caminho para o nosso arquivo de service worker fonte.
        swSrc: "src/sw.js",

        // Nome do arquivo do service worker final na pasta de build.
        swDest: "dist/sw.js",

        // *************** INÍCIO DA CORREÇÃO PARA O TIMEOUT ***************

        // Define explicitamente quais arquivos devem ser pré-cacheados.
        // Isso garante que apenas os arquivos essenciais para o app carregar
        // sejam incluídos, evitando o timeout.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],

        // Ignora arquivos que não são necessários offline ou que são muito grandes.
        // Source maps (.map) são inúteis para o usuário final.
        globIgnores: [
          "**/node_modules/**/*",
          "**/*.map",
          // Se você tiver uma imagem muito grande na pasta /public, adicione aqui.
          // Exemplo: '**/minha-imagem-grande.jpg'
        ],

        // ******************** FIM DA CORREÇÃO ********************
      },

      // Configuração do manifesto do PWA.
      manifest: {
        name: "Tryla",
        short_name: "Tryla",
        description: "Sua plataforma gamificada de aprendizado.", // Atualize com a sua descrição
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/icon-96-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean), // Filtra plugins que possam ser 'false'

  // Configuração de aliases de caminho
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
