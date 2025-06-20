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
      // 'autoUpdate' irá atualizar o service worker automaticamente no navegador do usuário
      // assim que uma nova versão for detectada, sem a necessidade de um prompt.
      registerType: "autoUpdate",

      // Especifica que vamos usar nosso próprio service worker como base.
      injectManifest: {
        // Caminho para o nosso arquivo de service worker fonte.
        // O build do Vite irá processar este arquivo.
        swSrc: "src/sw.js",

        // Nome do arquivo do service worker final na pasta de build (ex: 'dist/sw.js').
        swDest: "dist/sw.js",
      },

      // Configuração do manifesto do PWA.
      // Estes dados são usados quando o usuário instala o app no dispositivo.
      manifest: {
        name: "Tryla",
        short_name: "Tryla",
        description: "A sua plataforma para [descreva o que o app faz].",
        theme_color: "#ffffff", // Cor da barra de título do app
        background_color: "#ffffff", // Cor da tela de splash
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable", // 'maskable' ajuda o ícone a se adaptar melhor em diferentes formatos no Android
          },
          {
            src: "icons/icon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          // Adicione outros tamanhos se necessário
          {
            src: "icons/icon-96-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean), // Filtra plugins que possam ser 'false' (como o lovable-tagger em produção)

  // Configuração de aliases de caminho
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
