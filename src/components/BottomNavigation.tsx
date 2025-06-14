
import { Home, Compass, Users, FlaskConical, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, path: "/dashboard", label: "Início" },
  { icon: Compass, path: "/modulos", label: "Trilhas" },
  { icon: Users, path: "/social", label: "Social" },
  { icon: FlaskConical, path: "/lab", label: "Lab" },
  { icon: User, path: "/perfil", label: "Perfil" },
];

const BottomNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4">
        <nav className="relative w-full rounded-3xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/10 dark:shadow-black/30">
          {/* Gradient overlay for modern look */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
          
          <div className="relative grid grid-cols-5 items-center p-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active background with modern gradient */}
                  {active && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25" />
                  )}
                  
                  {/* Icon container with modern styling */}
                  <div className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                    active 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground group-hover:text-foreground group-hover:bg-accent/50"
                  )}>
                    <item.icon 
                      className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" 
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Label with modern typography */}
                  <span className={cn(
                    "relative z-10 mt-1 text-[10px] font-bold tracking-wide transition-all duration-300",
                    active 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-accent/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              );
            })}
          </div>
          
          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-border to-transparent rounded-full" />
        </nav>
      </div>
    </div>
  );
};

export default BottomNavigation;
