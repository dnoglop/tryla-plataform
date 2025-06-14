
import React from "react";
import BottomNavigation from "@/components/BottomNavigation";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
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
