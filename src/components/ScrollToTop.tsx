// ARQUIVO: src/components/ScrollToTop.tsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  // Pega o objeto de localização, que contém a URL atual
  const { pathname } = useLocation();

  // Este useEffect será executado toda vez que o 'pathname' mudar
  useEffect(() => {
    // Rola a janela para a posição x: 0, y: 0 (o topo)
    window.scrollTo(0, 0);
  }, [pathname]); // O array de dependências garante que isso só rode na mudança de rota

  // Este componente não renderiza nenhum HTML
  return null;
};

export default ScrollToTop;
