
import { Award, BookOpen, Home, MessageCircle, User, Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const BottomNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, path: "/dashboard", label: "Início" },
    { icon: BookOpen, path: "/modulos", label: "Trilhas" },
    { icon: Award, path: "/recompensas", label: "Ranking" },
    { icon: MessageCircle, path: "/comunidade", label: "Comunidade" },
    { icon: Bot, path: "/tutor", label: "Tutor" },
    { icon: User, path: "/perfil", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-100">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center px-1 py-2 w-full"
          >
            <div className={`flex flex-col items-center ${
              isActive(item.path)
                ? "text-[#e36322]"
                : "text-gray-400"
            }`}>
              <item.icon className={`w-5 h-5 ${
                isActive(item.path) && "animate-bounce-slow"
              }`} />
              <span className={`text-[10px] mt-0.5 font-medium ${isMobile ? 'block' : ''}`}>{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
