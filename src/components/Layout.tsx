// src/components/Layout.tsx

import React from "react";
import { Outlet } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";

const Layout = () => {
  return (
    // MUDANÇA: bg-slate-50 substituído por bg-background para suportar dark mode.
    <div className="relative min-h-screen bg-background">
      {/* O padding-bottom agora é um pouco maior para acomodar a nova barra de navegação */}
      <main className="pb-24">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Layout;
