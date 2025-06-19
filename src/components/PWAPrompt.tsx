import { useRegisterSW } from "virtual:pwa-register/react";

function PWAPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("Service Worker registrado:", r);
    },
    onRegisterError(error) {
      console.log("Erro no registro do Service Worker:", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 p-4 rounded-xl shadow-lg bg-card text-card-foreground border">
      <div className="mb-3 text-center">
        {offlineReady ? (
          <span className="font-semibold">
            App pronto para funcionar offline!
          </span>
        ) : (
          <span className="font-semibold">Nova versão disponível!</span>
        )}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <button
            className="btn-trilha"
            onClick={() => updateServiceWorker(true)}
          >
            Atualizar
          </button>
        )}
        <button className="btn-secundario" onClick={close}>
          Fechar
        </button>
      </div>
    </div>
  );
}

export default PWAPrompt;
