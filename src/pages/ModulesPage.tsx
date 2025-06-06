import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import { useQuery } from '@tanstack/react-query';
import { getModules, getModuleProgress, isModuleCompleted, Module } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton"; // Importando o Skeleton

// --- NOVO COMPONENTE DE SKELETON ---
const ModulesPageSkeleton = () => (
    <div className="pb-24 min-h-screen bg-gray-50 animate-pulse">
        <div className="container px-4 pt-8 pb-6 space-y-4">
            {/* Header de Saudação */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48 bg-slate-200" />
                    <Skeleton className="h-4 w-32 bg-slate-200" />
                </div>
            </div>
            {/* Barra de Busca */}
            <Skeleton className="h-12 w-full rounded-full bg-slate-200" />
        </div>
        <div className="container px-4 py-2 space-y-8">
            {/* Card de Foco Principal */}
            <div>
                <Skeleton className="h-6 w-32 mb-3 bg-slate-200" />
                <Skeleton className="h-48 w-full rounded-2xl bg-slate-200" />
            </div>
            {/* Grid com os outros módulos */}
            <div>
                <Skeleton className="h-6 w-40 mb-3 bg-slate-200" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-40 rounded-2xl bg-slate-200" />
                    <Skeleton className="h-40 rounded-2xl bg-slate-200" />
                    <Skeleton className="h-40 rounded-2xl bg-slate-200" />
                    <Skeleton className="h-40 rounded-2xl bg-slate-200" />
                </div>
            </div>
        </div>
    </div>
);


// --- COMPONENTE PRINCIPAL ---
const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});
  const navigate = useNavigate();

  // Usando react-query para gerenciar o estado de carregamento dos dados principais
  const { data: initialData, isLoading } = useQuery({
    queryKey: ['modulesPageInitialData'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const [userProfile, modules] = await Promise.all([
        getProfile(user.id),
        getModules()
      ]);

      if (!modules || modules.length === 0) {
        return { userProfile, modules: [], progressData: {}, completedData: {} };
      }

      const progressPromises = modules.map(m => getModuleProgress(user.id, m.id));
      const completedPromises = modules.map(m => isModuleCompleted(user.id, m.id));

      const [progressResults, completedResults] = await Promise.all([
        Promise.all(progressPromises),
        Promise.all(completedPromises)
      ]);

      const progressData: {[key: number]: number} = {};
      const completedData: {[key: number]: boolean} = {};
        
      modules.forEach((module, index) => {
        progressData[module.id] = progressResults[index];
        completedData[module.id] = completedResults[index];
      });

      return { userProfile, modules, progressData, completedData };
    },
    retry: 1, // Tentar novamente uma vez em caso de falha
  });

  // Atualizando os estados locais quando os dados do react-query chegam
  useEffect(() => {
    if (initialData) {
      setProfile(initialData.userProfile);
      setModuleProgress(initialData.progressData);
      setCompletedModules(initialData.completedData);
    }
  }, [initialData]);

  const modules = initialData?.modules || [];

  const isModuleLocked = (index: number) => {
    if (index === 0) return false;
    const prevModuleId = modules[index - 1]?.id;
    if (!prevModuleId) return true;
    return !completedModules[prevModuleId];
  };

  const nextModule = modules.find((module, index) => !isModuleLocked(index) && !completedModules[module.id]);
  const otherModules = modules.filter(module => module.id !== nextModule?.id);

  const filteredOtherModules = otherModules.filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // <<< MUDANÇA PRINCIPAL: USANDO O SKELETON >>>
  if (isLoading) {
    return <ModulesPageSkeleton />;
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <div className="container px-4 pt-8 pb-6 space-y-4">
        {/* Header de Saudação */}
        <div className="flex items-center gap-3">
          <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name?.split(' ')[0] || 'A'}`} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || "Aluno"}!
            </h1>
            <p className="text-sm text-gray-500">Pronto para aprender hoje?</p>
          </div>
        </div>
        
        {/* Barra de Busca */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar em todos os módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="container px-4 py-2 space-y-8">
        {/* Card de Foco Principal */}
        {nextModule && !searchTerm && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Foco do dia</h2>
            <div className="bg-orange-500 text-white p-5 rounded-2xl shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-bold">{nextModule.name}</h3>
                <p className="text-white/80 text-sm mt-1">{nextModule.description}</p>
              </div>
              <div>
                <Progress value={moduleProgress[nextModule.id] || 0} className="h-2 bg-white/20 [&>*]:bg-white" />
                <p className="text-xs text-white/80 mt-1">{Math.round(moduleProgress[nextModule.id] || 0)}% completo</p>
              </div>
              <Button onClick={() => navigate(`/modulo/${nextModule.id}`)} className="bg-white text-orange-500 font-bold w-full rounded-full py-3 hover:bg-gray-100 transition-all">
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Grid com os outros módulos */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            {searchTerm ? 'Resultados da busca' : 'Todos os Módulos'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(searchTerm ? filteredOtherModules : otherModules).map((module, index) => {
              const moduleIndexInAll = modules.findIndex(m => m.id === module.id);
              return (
                <ModuleCard
                  key={module.id}
                  id={module.id}
                  title={module.name}
                  description={module.description}
                  emoji={module.emoji}
                  type={module.type || "autoconhecimento"}
                  progress={moduleProgress[module.id] || 0}
                  completed={completedModules[module.id] || false}
                  locked={isModuleLocked(moduleIndexInAll)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};
export default ModulesPage;
