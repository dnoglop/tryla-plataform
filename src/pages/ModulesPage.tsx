// ARQUIVO: src/pages/ModulesPage.tsx (VERSÃO CORRIGIDA E COMPLETA)

import { useState } from "react";
import { Search } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import { useQuery } from "@tanstack/react-query";
import {
  getModules,
  getModuleProgress,
  isModuleCompleted,
  Module,
} from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// --- SKELETON (NÃO PRECISA MUDAR) ---
const ModulesPageSkeleton = () => (
  <div className="pb-24 min-h-screen bg-background animate-pulse">
    <div className="container px-4 pt-8 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-muted" />
    </div>
    <div className="container px-4 py-2 space-y-8">
      <div>
        <Skeleton className="h-6 w-32 mb-3 bg-muted" />
        <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
      </div>
      <div>
        <Skeleton className="h-6 w-40 mb-3 bg-muted" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-40 rounded-2xl bg-muted" />
          <Skeleton className="h-40 rounded-2xl bg-muted" />
          <Skeleton className="h-40 rounded-2xl bg-muted" />
          <Skeleton className="h-40 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["modulesPageInitialData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // ==========================================================
      // LÓGICA CORRIGIDA COMEÇA AQUI
      // ==========================================================

      // 1. Busca o perfil do usuário e a trilha DELE em paralelo.
      const [userProfile, userTrackResult] = await Promise.all([
        getProfile(user.id),
        supabase
          .from('user_tracks')
          .select('module_ids')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() // Usa maybeSingle para não dar erro se o usuário não tiver trilha.
      ]);
      
      const userTrack = userTrackResult?.data;
      let modules: Module[] = [];

      // 2. Decide QUAIS módulos buscar com base na existência de uma trilha.
      if (userTrack && userTrack.module_ids && userTrack.module_ids.length > 0) {
        // Se o usuário TEM uma trilha, busca APENAS os módulos daquela trilha.
        const { data: trackModules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .in('id', userTrack.module_ids);
        
        if (modulesError) throw modulesError;

        // Garante que os módulos sejam exibidos na ordem recomendada pela IA.
        modules = userTrack.module_ids.map(id => 
          trackModules.find(m => m.id === id)
        ).filter(Boolean) as Module[];

      } else {
        // Se o usuário NÃO tem trilha, busca TODOS os módulos (comportamento antigo).
        modules = await getModules();
      }

      // 3. Busca o progresso APENAS para os módulos que serão exibidos.
      if (!modules || modules.length === 0) {
        return { userProfile, modules: [], progressData: {}, completedData: {} };
      }
      const progressPromises = modules.map((m) => getModuleProgress(user.id, m.id));
      const completedPromises = modules.map((m) => isModuleCompleted(user.id, m.id));
      const [progressResults, completedResults] = await Promise.all([
        Promise.all(progressPromises),
        Promise.all(completedPromises),
      ]);
      
      const progressData: { [key: number]: number } = {};
      const completedData: { [key: number]: boolean } = {};
      modules.forEach((module, index) => {
        progressData[module.id] = progressResults[index];
        completedData[module.id] = completedResults[index];
      });

      // 4. Retorna todos os dados necessários para a página.
      return { userProfile, modules, progressData, completedData };
    },
    retry: 1,
  });

  const profile = initialData?.userProfile;
  const modules = initialData?.modules || [];
  const moduleProgress = initialData?.progressData || {};
  const completedModules = initialData?.completedData || {};

  const isModuleLocked = (index: number) => {
    if (index === 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    if (!prevModuleId) return true;
    return !completedModules[prevModuleId];
  };

  const nextModule = modules.find(
    (module, index) => !isModuleLocked(index) && !completedModules[module.id],
  );

  // A lógica de "otherModules" não é mais necessária, pois agora mostramos a trilha inteira.
  const filteredModules = modules.filter(
    (module) =>
      module.id !== nextModule?.id &&
      module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (isLoading) {
    return <ModulesPageSkeleton />;
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <div className="container px-4 pt-8 pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(" ")[0] || "A"}`}
            alt="Avatar"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Aluno"}!
            </h1>
            <p className="text-sm text-muted-foreground">Pronto para aprender hoje?</p>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar na sua trilha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border text-card-foreground placeholder:text-muted-foreground rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <div className="container px-4 py-2 space-y-8">
        {nextModule && !searchTerm && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Foco do dia</h2>
            <div className="bg-primary text-primary-foreground p-5 rounded-2xl shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-bold">{nextModule.name}</h3>
                <p className="text-primary-foreground/80 text-sm mt-1">{nextModule.description}</p>
              </div>
              <div>
                <Progress value={moduleProgress[nextModule.id] || 0} className="h-2 bg-primary-foreground/20 [&>*]:bg-primary-foreground" />
                <p className="text-xs text-primary-foreground/80 mt-1">{Math.round(moduleProgress[nextModule.id] || 0)}% completo</p>
              </div>
              <Button
                onClick={() => navigate(`/modulo/${nextModule.id}`)}
                className="bg-primary-foreground text-primary font-bold w-full rounded-full py-3 hover:bg-gray-100 transition-all"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">
            {searchTerm ? "Resultados da busca" : "Sua Trilha de Aprendizado"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredModules.map((module, index) => {
                // Precisamos do índice original para a lógica de "locked"
                const originalIndex = modules.findIndex(m => m.id === module.id);
                return (
                  <ModuleCard
                    key={module.id}
                    id={module.id}
                    name={module.name}
                    description={module.description}
                    emoji={module.emoji}
                    type={module.type || "autoconhecimento"}
                    progress={moduleProgress[module.id] || 0}
                    completed={completedModules[module.id] || false}
                    locked={isModuleLocked(originalIndex)}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};
export default ModulesPage;