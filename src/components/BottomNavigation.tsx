
import React from "react";
import { Home, BookOpen, Users, Wrench, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Início", path: "/inicio" },
    { icon: BookOpen, label: "Módulos", path: "/modulos" },
    { icon: Users, label: "Social", path: "/social" },
    { icon: Wrench, label: "Lab", path: "/lab" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 shadow-lg">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 ease-out relative",
                "min-w-[50px] py-2",
                isActive ? "transform -translate-y-1" : ""
              )}
            >
              {/* Container do ícone com background circular para aba ativa */}
              <div className={cn(
                "flex items-center justify-center transition-all duration-300 ease-out relative",
                isActive 
                  ? "bg-primary rounded-full w-12 h-8 shadow-lg" 
                  : "w-6 h-6"
              )}>
                <Icon 
                  className={cn(
                    "transition-all duration-300 ease-out",
                    isActive 
                      ? "h-5 w-5 text-white" 
                      : "h-6 w-6 text-gray-500"
                  )} 
                  strokeWidth={2}
                />
              </div>
              
              {/* Label - apenas para aba ativa */}
              <div className="h-4 flex items-center justify-center mt-1">
                {isActive && (
                  <span className="text-xs font-medium text-primary animate-fade-in">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
