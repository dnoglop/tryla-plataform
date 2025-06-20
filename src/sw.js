// src/sw.js - VERSÃO DE TESTE MÍNIMO

// Log imediato para testar se o script executa.
console.log(
  "✅ SW Mínimo INICIADO! Se você vê isso, o build e o registro funcionam.",
);

// Listener de instalação
self.addEventListener("install", (event) => {
  console.log("✅ SW Mínimo: Evento de INSTALAÇÃO.");
  // Força a ativação do novo SW imediatamente.
  self.skipWaiting();
});

// Listener de ativação
self.addEventListener("activate", (event) => {
  console.log("✅ SW Mínimo: Evento de ATIVAÇÃO.");
});

// Listener de push (para nosso teste final)
self.addEventListener("push", (event) => {
  console.log("🅿️ SW Mínimo: Evento de PUSH recebido!");
  const title = "Teste do SW Mínimo";
  const options = {
    body: "A notificação finalmente funcionou!",
    icon: "/icons/icon-192-192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Adicionamos um listener de fetch vazio para garantir que o PWA continue "instalável"
self.addEventListener("fetch", (event) => {
  // Não fazemos nada aqui, apenas respondemos ao evento.
});
