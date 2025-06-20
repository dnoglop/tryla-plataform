// src/sw.js (VERSÃO CORRIGIDA)

// A MUDANÇA ESTÁ AQUI: Importamos o manifesto como um módulo virtual.
// O @vite-ignore é importante para que o Vite não tente resolver isso de forma literal.
import { precacheAndRoute } from "workbox-precaching";

// Limpa caches antigos ao ativar
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Defina aqui um prefixo para os seus caches do workbox
            // para não apagar outros caches importantes.
            return cacheName.startsWith("workbox-precache");
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          }),
      );
    }),
  );
});

// A injeção do manifesto agora é tratada pelo build do VitePWA.
// A linha 'precacheAndRoute(self.__WB_MANIFEST)' não é mais necessária aqui
// porque a configuração do injectManifest já cuida disso.

// ----------------------------------------------------
// AQUI COMEÇA A SUA LÓGICA CUSTOMIZADA ORIGINAL
// ----------------------------------------------------

console.log("✅ Service Worker principal carregado!");

// Ouve por eventos de message do cliente (para o skipWaiting)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Ouve por eventos de push
self.addEventListener("push", (event) => {
  console.log("🅿️ Evento de Push recebido!", event);
  try {
    const data = event.data.json();
    console.log("📦 Dados do Push:", data);
    const title = data.title || "Tryla";
    const options = {
      body: data.body,
      icon: "/icons/icon-192-192.png",
      badge: "/icons/icon-96-96.png",
      data: {
        url: data.url || "/",
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("❌ Erro ao processar o push:", e);
    // Notificação de fallback caso o JSON falhe
    event.waitUntil(
      self.registration.showNotification("Nova Notificação", {
        body: "Você recebeu uma nova atualização.",
        icon: "/icons/icon-192-192.png",
      }),
    );
  }
});

// Ouve por cliques na notificação
self.addEventListener("notificationclick", (event) => {
  console.log(
    "🖱️ Clique na notificação recebido!",
    event.notification.data.url,
  );
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
