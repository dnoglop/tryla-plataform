// ARQUIVO: src/components/Layout.tsx (VERSÃO FINAL COMPLETA)

import React from "react";
import BottomNavigation from "@/components/BottomNavigation";

// A interface define as props que o componente aceita.
interface LayoutProps {
  children: React.ReactNode; // 'children' é o conteúdo que será envolvido pelo layout.
  className?: string;         // 'className' opcional para estilização extra.
}

// O componente Layout recebe 'children' como prop.
const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    // O div principal que envolve todo o layout padrão.
    // 'relative' é importante para o posicionamento de elementos filhos.
    // 'min-h-screen' garante que o layout ocupe pelo menos a altura total da tela.
    <div className={`relative min-h-screen bg-background ${className || ''}`}>

      {/* O 'main' é onde o conteúdo da página (children) será renderizado. */}
      {/* 'pb-24' (padding-bottom) cria um espaço no final da página para que
          o conteúdo não fique escondido atrás da BottomNavigation. */}
      <main className="pb-24">
        {children}
      </main>

      {/* A navegação inferior é um componente fixo em todas as páginas que usam este layout. */}
      <BottomNavigation />
    </div>
  );
};

export default Layout;