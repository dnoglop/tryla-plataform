// ARQUIVO: src/components/Layout.tsx (VERSÃO FINAL E CORRIGIDA)

import React from "react";
import { useLocation } from "react-router-dom"; // Importe o hook de localização
import BottomNavigation from "@/components/BottomNavigation";

interface LayoutProps {
  children: React.ReactNode;
  className?: string; // Adicionando className para flexibilidade
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const location = useLocation();

  // Lista de rotas que devem ter seu próprio layout de tela cheia
  // e não devem usar o layout padrão com BottomNavigation.
  const fullPageRoutes = [
    '/modulo/', // Corresponde a /modulo/:id e /modulo/:moduleId/fase/:id
    '/onboarding',
    '/login',
    '/register',
    '/cadastro',
    '/' // SplashScreen
  ];

  // Verifica se a rota atual é uma das rotas de tela cheia
  const isFullPage = fullPageRoutes.some(route => 
    route === '/' ? location.pathname === '/' : location.pathname.startsWith(route)
  );

  // Se for uma rota de tela cheia, renderiza apenas o conteúdo (children),
  // permitindo que a própria página controle 100% do seu layout.
  if (isFullPage) {
    return <>{children}</>;
  }

  // Para todas as outras páginas (Dashboard, Perfil, etc.), aplica o layout padrão.
  return (
    <div className="relative min-h-screen bg-background">
      <main className="pb-24">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;