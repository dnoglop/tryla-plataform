// ARQUIVO: src/components/BottomNavigation.tsx (VERSÃO ATUALIZADA)

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// 1. IMPORTAR HOOKS E SERVIÇOS NECESSÁRIOS
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";

// Ícones
import { Home, BookOpen, Users, Wrench, User } from "lucide-react";

// --- DADOS DA NAVEGAÇÃO ---
// Adicionamos um 'id' para facilitar a identificação do item de perfil
const navItems = [
  { id: "inicio", icon: Home, label: "Início", path: "/inicio" },
  { id: "modulos", icon: BookOpen, label: "Módulos", path: "/modulos" },
  { id: "social", icon: Users, label: "Social", path: "/social" },
  { id: "lab", icon: Wrench, label: "Lab", path: "/lab" },
  { id: "perfil", icon: User, label: "Perfil", path: "/perfil" },
];

// --- HOOK PARA BUSCAR O PERFIL ATUAL ---
const useCurrentUserProfile = () => {
    return useQuery<Profile | null>({
        // Chave de query única para o perfil do usuário logado
        queryKey: ['currentUserProfile'], 
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            return await getProfile(user.id);
        },
        staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    });
}


// --- COMPONENTE PRINCIPAL ---
const BottomNavigation: React.FC = () => {
  const location = useLocation();

  // 2. CHAMAR O HOOK PARA OBTER OS DADOS DO PERFIL
  const { data: profile } = useCurrentUserProfile();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 shadow-lg">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          // Variável para checar se é a aba de perfil
          const isProfileTab = item.id === 'perfil';
          const hasAvatar = isProfileTab && profile?.avatar_url;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-300 ease-out relative",
                "min-w-[50px] py-1", // Ajuste no padding
                isActive ? "transform -translate-y-1" : ""
              )}
            >
              {/* 3. LÓGICA DE RENDERIZAÇÃO CONDICIONAL */}
              <div 
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300 ease-out",
                  // Estilo para o avatar de perfil
                  isProfileTab
                    ? `w-8 h-8 border-2 ${isActive ? 'border-primary' : 'border-transparent'}`
                    // Estilo para os ícones normais
                    : `w-12 h-8 ${isActive ? 'bg-primary shadow-lg' : ''}`
                )}
              >
                {hasAvatar ? (
                  // Se for a aba de perfil E tiver um avatar, mostre a imagem
                  <img
                    src={profile.avatar_url}
                    alt="Seu perfil"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  // Caso contrário, mostre o ícone padrão
                  <Icon
                    className={cn(
                      "transition-all duration-300 ease-out",
                      isActive
                        ? (isProfileTab ? "h-4 w-4 text-primary" : "h-5 w-5 text-primary-foreground")
                        : "h-6 w-6 text-muted-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                )}
              </div>

              {/* Label */}
              <div className="h-4 flex items-center justify-center mt-1.5">
                  <span className="text-xs font-medium text---secondary animate-fade-in">
                    {item.label}
                  </span>
               
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;