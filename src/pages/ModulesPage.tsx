// ARQUIVO: src/pages/ModulesPage.tsx (VERSÃO REATORADA)

import { useState } from "react";
import { Search, ArrowRight, Lock } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard"; // Usaremos o novo ModuleCard
import { useQuery } from "@tanstack/react-query";
import { getModuleProgress, isModuleCompleted, Module } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { Progress } from "@/components/ui/progress";
import { useNavigate, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// --- SKELETON (NÃO PRECISA MUDAR) ---
// (O componente de Skeleton permanece o mesmo do seu código original)
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
        </div>
      </div>
    </div>
  </div>
);

// --- MUDANÇA: COMPONENTE PARA O CARD DE DESTAQUE ---
// Inspirado no FeaturedTool da LabPage
const FeaturedModuleCard = ({ module, progress }: { module: Module, progress: number }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/modulo/${module.id}`)}
      className="group bg-primary/10 dark:bg-primary/20 p-5 sm:p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-primary/30"
    >
      <div className="flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center bg-primary text-4xl">
        {module.emoji || "🎯"}
      </div>
      <div className="flex-grow">
        <h3 className="text-2xl font-bold text-primary/90 dark:text-primary-foreground/90">{module.name}</h3>
        <p className="mt-1 text-muted-foreground max-w-lg">{module.description}</p>
        <div className="mt-4">
          <Progress value={progress} className="h-2 bg-primary/20 [&>*]:bg-primary" />
          <p className="text-xs text-muted-foreground mt-1.5">{Math.round(progress)}% completo</p>
        </div>
      </div>
      <div className="mt-4 md:mt-0 ml-auto flex-shrink-0 self-end md:self-center">
        <div className="flex items-center gap-2 font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1">
          Continuar Missão
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // --- LÓGICA DE DADOS (useQuery) ---
  // (Esta lógica foi mantida exatamente como você forneceu, pois já está corrigida e otimizada)
  const { data: initialData, isLoading } = useQuery({
    queryKey: ["modulesPageInitialData"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const [userProfile, userTrackResult] = await Promise.all([
        getProfile(user.id),
        supabase
          .from('user_tracks')
          .select('module_ids')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      const userTrack = userTrackResult?.data;
      let modules: Module[] = [];

      if (userTrack && userTrack.module_ids && userTrack.module_ids.length > 0) {
        const { data: trackModules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .in('id', userTrack.module_ids);
        if (modulesError) throw modulesError;
        modules = userTrack.module_ids.map(id => 
          trackModules.find(m => m.id === id)
        ).filter(Boolean) as Module[];
      } else {
         const { data: allModules, error: allModulesError } = await supabase.from('modules').select('*');
         if (allModulesError) throw allModulesError;
         modules = allModules || [];
      }

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

      return { userProfile, modules, progressData, completedData };
    },
    retry: 1,
  });

  const profile = initialData?.userProfile;
  const modules = initialData?.modules || [];
  const moduleProgress = initialData?.progressData || {};
  const completedModules = initialData?.completedData || {};

  const isModuleLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    if (prevModuleId === undefined) return true;
    return !completedModules[prevModuleId];
  };

  const nextModule = modules.find(
    (module, index) => !isModuleLocked(index) && !completedModules[module.id],
  );

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
    <div className="pb-24 min-h-screen bg-background dark:bg-neutral-950">
      <header className="container px-4 pt-8 pb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/perfil" aria-label="Ir para o perfil">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(" ")[0] || "A"}&background=random`}
              alt="Avatar do usuário"
              className="h-14 w-14 rounded-full object-cover border-2 border-background shadow-md transition-transform hover:scale-110"
            />
          </Link>
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
      </header>

      <main className="container px-4 py-2 space-y-8">
        {nextModule && !searchTerm && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Foco do dia</h2>
            <FeaturedModuleCard 
              module={nextModule} 
              progress={moduleProgress[nextModule.id] || 0}
            />
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">
            {searchTerm ? "Resultados da busca" : "Suas missões atuais"}
          </h2>
          {filteredModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredModules.map((module) => {
                  const originalIndex = modules.findIndex(m => m.id === module.id);
                  return (
                    <ModuleCard
                      key={module.id}
                      id={module.id}
                      name={module.name}
                      description={module.description}
                      emoji={module.emoji}
                      progress={moduleProgress[module.id] || 0}
                      completed={completedModules[module.id] || false}
                      locked={isModuleLocked(originalIndex)}
                    />
                  );
                }
              )}
            </div>
          ) : (
            <div className="text-center py-10">
                <p className="text-muted-foreground">
                    {searchTerm ? "Nenhum módulo encontrado." : "Você concluiu todas as suas missões. Parabéns!"}
                </p>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};