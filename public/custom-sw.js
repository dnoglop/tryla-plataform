// public/custom-sw.js

// Ouve por eventos de push
self.addEventListener("push", (event) => {
  const data = event.data.json(); // Pega os dados enviados (title, body, url)
  const title = data.title || "Tryla";
  const options = {
    body: data.body,
    icon: "/icons/icon-192-192.png", // Ícone padrão da notificação
    badge: "/icons/icon-96-96.png", // Ícone pequeno (para Android)
    data: {
      url: data.url || "/", // URL para abrir ao clicar
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ouve por cliques na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Fecha a notificação
  const urlToOpen = event.notification.data.url;

  // Abre a URL correta em uma nova janela ou foca em uma já existente
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
