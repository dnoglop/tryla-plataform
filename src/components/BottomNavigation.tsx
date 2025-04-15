
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] rounded-t-2xl">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center px-3 py-2 ${
              isActive(item.path)
                ? "text-trilha-orange font-medium"
                : "text-gray-500"
            }`}
          >
            <item.icon className={`w-5 h-5 ${
              isActive(item.path) && "animate-bounce-slow"
            }`} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
