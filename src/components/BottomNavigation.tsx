import { Home, Compass, Users, FlaskConical, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/dashboard", label: "Início" },
  { icon: Compass, path: "/modulos", label: "Trilhas" },
  { icon: Users, path: "/social", label: "Social" }, // <<< ROTA ATUALIZADA AQUI
  { icon: FlaskConical, path: "/lab", label: "Lab" },
  { icon: User, path: "/perfil", label: "Perfil" },
];

// ... o resto do seu componente BottomNavigation permanece o mesmo
const BottomNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-md rounded-full border border-slate-200/80 bg-white/80 shadow-lg shadow-slate-300/20 backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center justify-items-center gap-1 p-1.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} className="group flex h-16 w-full flex-col items-center justify-center rounded-full transition-colors duration-300" aria-current={active ? "page" : undefined}>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300", active ? "bg-orange-100" : "")}>
                  <item.icon className={cn("h-5 w-5 transition-colors duration-300", active ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600")} strokeWidth={2.5}/>
                </div>
                <span className={cn("mt-1 text-[11px] font-bold tracking-tight transition-colors duration-300", active ? "text-orange-500" : "text-slate-500 group-hover:text-slate-700")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
export default BottomNavigation;