
import { Award, BookOpen, Home, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, path: "/dashboard", label: "Início" },
    { icon: BookOpen, path: "/modulos", label: "Trilhas" },
    { icon: Award, path: "/recompensas", label: "Conquistas" },
    { icon: MessageSquare, path: "/comunidade", label: "Comunidade" },
    { icon: User, path: "/perfil", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] border-t border-gray-100">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center px-1 py-3 w-full"
          >
            <div className={`flex flex-col items-center ${
              isActive(item.path)
                ? "text-trilha-orange"
                : "text-gray-400"
            }`}>
              <item.icon className={`w-6 h-6 ${
                isActive(item.path) && "animate-bounce-slow"
              }`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
