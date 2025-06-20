// src/sw.js

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";

// Esta linha é crucial! O Vite/Workbox substituirá 'self.__WB_MANIFEST'
// pela lista de arquivos a serem cacheados durante o build.
precacheAndRoute(self.__WB_MANIFEST);

// Limpa caches antigos
cleanupOutdatedCaches();

// Rota de navegação para que o app funcione offline (SPA)
// Sempre serve o index.html para qualquer navegação.
const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL("index.html"),
);
registerRoute(navigationRoute);

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

console.log("✅ Service Worker principal carregado! Versão 2.0");

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
