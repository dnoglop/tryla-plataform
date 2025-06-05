import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard"; // Componente reestilizado
import { useQuery } from '@tanstack/react-query';
import { getModules, getModuleProgress, isModuleCompleted, Module } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
        const userProfile = await getProfile(data.user.id);
        setProfile(userProfile);
      }
    };
    fetchUserAndProfile();
  }, []);

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!userId || modules.length === 0) {
        if (modules.length > 0) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const progressPromises = modules.map(m => getModuleProgress(userId, m.id));
      const completedPromises = modules.map(m => isModuleCompleted(userId, m.id));

      try {
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
        
        setModuleProgress(progressData);
        setCompletedModules(completedData);
      } catch (error) {
        console.error("Erro ao carregar dados dos módulos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
  }, [userId, modules]);

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

  if (isLoading) {
    return (
      <div className="pb-16 min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      <div className="container px-4 pt-8 pb-6 space-y-4">
        {/* Header de Saudação */}
        <div className="flex items-center gap-3">
          <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'A'}&background=FFDAB9&color=E36322`} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
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
            className="w-full bg-white border border-gray-200 text-gray-700 placeholder-gray-400 rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-trilha-orange/50 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="container px-4 py-2 space-y-8">
        {/* Card de Foco Principal */}
        {nextModule && !searchTerm && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">Foco do dia</h2>
            <div className="bg-trilha-orange text-white p-5 rounded-2xl shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-2xl font-bold">{nextModule.name}</h3>
                <p className="text-white/80 text-sm mt-1">{nextModule.description}</p>
              </div>
              <div>
                <Progress value={moduleProgress[nextModule.id] || 0} className="h-2 bg-white/20 [&>*]:bg-white" />
                <p className="text-xs text-white/80 mt-1">{Math.round(moduleProgress[nextModule.id] || 0)}% completo</p>
              </div>
              <Button onClick={() => navigate(`/modulo/${nextModule.id}`)} className="bg-white text-trilha-orange font-bold w-full rounded-full py-3 hover:bg-gray-100 transition-all">
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
            {(searchTerm ? filteredOtherModules : otherModules).map((module) => {
              const moduleIndex = modules.findIndex(m => m.id === module.id);
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
                  locked={isModuleLocked(moduleIndex)}
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