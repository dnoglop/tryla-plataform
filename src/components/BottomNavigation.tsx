
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 shadow-2xl">
      <div className="flex items-center justify-around py-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center px-3 py-2.5 rounded-2xl transition-all duration-300 relative group min-w-[60px]",
                isActive
                  ? "text-primary scale-110"
                  : "text-muted-foreground hover:text-foreground hover:scale-105"
              )}
            >
              {/* Indicador ativo com gradiente */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl animate-pulse" />
              )}
              
              {/* Efeito hover */}
              <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Ícone com efeito */}
              <div className="relative z-10">
                <Icon 
                  className={cn(
                    "h-5 w-5 mb-1 transition-all duration-300",
                    isActive ? "drop-shadow-sm" : ""
                  )} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  "text-xs font-medium transition-all duration-300 relative z-10",
                  isActive ? "font-semibold" : ""
                )}
              >
                {item.label}
              </span>
              
              {/* Dot indicator para ativo */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-bounce" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
