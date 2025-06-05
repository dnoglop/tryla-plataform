import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from '@/components/BottomNavigation';

const Layout = () => {
  return (
    // MUDANÇA: bg-slate-50 cria um fundo off-white muito limpo e moderno.
    <div className="relative min-h-screen bg-slate-50">
      
      {/* O padding-bottom agora é um pouco maior para acomodar a nova barra de navegação */}
      <main className="pb-24">
        <Outlet />
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Layout;