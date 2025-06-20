// public/push-sw.js

// Este log deve aparecer assim que o Workbox carregar este script.
console.log("✅ push-sw.js CARREGADO! A lógica de push está pronta.");

// Listener de PUSH
self.addEventListener("push", (event) => {
  console.log("🅿️ Evento de PUSH recebido no push-sw.js!");

  let data = {};
  try {
    // Tenta decodificar o JSON. Se falhar, usa um objeto vazio.
    data = event.data.json();
  } catch (e) {
    console.warn(
      "Não foi possível decodificar o payload do push como JSON.",
      e,
    );
  }

  const title = data.title || "Tryla";
  const options = {
    body: data.body || "Você tem uma nova mensagem!",
    icon: "/icons/icon-192-192.png",
    badge: "/icons/icon-96-96.png",
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener de CLIQUE na notificação
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
