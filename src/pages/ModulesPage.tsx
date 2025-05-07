
import { useState, useEffect } from "react";
import { Search, Video, FileText, HelpCircle, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import ProgressBar from "@/components/ProgressBar";
import { useQuery } from '@tanstack/react-query';
import { getModules, getPhasesByModuleId, getModuleProgress, isModuleCompleted, Module, Phase } from "@/services/moduleService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  const [modulePhases, setModulePhases] = useState<Record<number, Phase[]>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [moduleProgress, setModuleProgress] = useState<{[key: number]: number}>({});
  const [completedModules, setCompletedModules] = useState<{[key: number]: boolean}>({});
  const isMobile = useIsMobile();
  
  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  // Fetch modules from Supabase
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
  });

  // Load phases for each module
  useEffect(() => {
    const fetchAllPhases = async () => {
      const phasesObj: Record<number, Phase[]> = {};
      
      for (const module of modules) {
        try {
          const phases = await getPhasesByModuleId(module.id);
          phasesObj[module.id] = phases;
        } catch (error) {
          console.error(`Error loading phases for module ${module.id}:`, error);
        }
      }
      
      setModulePhases(phasesObj);
    };
    
    if (modules.length > 0) {
      fetchAllPhases();
    }
  }, [modules]);

  // Fetch progress and completion status for each module
  useEffect(() => {
    const fetchModuleProgress = async () => {
      if (!userId || modules.length === 0) return;
      
      const progressData: {[key: number]: number} = {};
      const completedData: {[key: number]: boolean} = {};
      
      for (const module of modules) {
        try {
          const progress = await getModuleProgress(userId, module.id);
          const completed = await isModuleCompleted(userId, module.id);
          
          progressData[module.id] = progress;
          completedData[module.id] = completed;
        } catch (error) {
          console.error(`Error loading progress for module ${module.id}:`, error);
        }
      }
      
      setModuleProgress(progressData);
      setCompletedModules(completedData);
      
      // Calculate total progress
      if (Object.keys(progressData).length > 0) {
        const totalProgressValue = Object.values(progressData).reduce(
          (sum, progress) => sum + progress, 
          0
        ) / Object.keys(progressData).length;
        
        setTotalProgress(Math.round(totalProgressValue));
      }
    };
    
    fetchModuleProgress();
  }, [userId, modules]);

  // Filter modules based on search
  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group modules by type for better organization
  const groupedModules = modules.reduce<Record<string, Module[]>>((acc, module) => {
    const type = module.type || "autoconhecimento";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(module);
    return acc;
  }, {});

  // Translate module type to human readable format
  const getModuleTypeTitle = (type: string) => {
    const types: Record<string, string> = {
      autoconhecimento: "Autoconhecimento",
      empatia: "Empatia",
      growth: "Desenvolvimento Pessoal",
      comunicacao: "Comunicação",
      futuro: "Futuro"
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to get module content
  const getModuleContent = (moduleId: number) => {
    return modulePhases[moduleId] || [];
  };

  // Updated logic: determine if a module should be locked
  // A module is unlocked if it's the first one, or if the previous module is completed
  // or if it has any progress
  const isModuleLocked = (index: number, moduleId: number) => {
    if (index === 0) return false; // First module is always unlocked
    
    // If this module already has progress, it's unlocked
    if (moduleProgress[moduleId] > 0) return false;
    
    // Check if previous module is completed
    const prevModuleId = modules[index - 1]?.id;
    if (prevModuleId && completedModules[prevModuleId]) {
      return false; // Previous module is completed, so this one is unlocked
    }
    
    return true; // In all other cases, lock the module
  };

  if (isLoadingModules) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      <Header title="🧠 Trilha de Aprendizado" />

      <div className="container px-3 py-4 space-y-4">
        {/* Overall Progress Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-3 sm:p-5 bg-gradient-to-r from-amber-50 to-[#FFDCCC]">
            <h2 className="mb-2 font-bold text-base sm:text-lg">Progresso Total</h2>
            <ProgressBar 
              progress={totalProgress} 
              className="h-2 sm:h-3" 
              showIcon={totalProgress === 100}
              compact={isMobile}
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs sm:text-sm text-gray-600">{totalProgress}% completo</p>
              {totalProgress < 100 && (
                <span className="text-xs sm:text-sm font-medium text-trilha-orange">Continue!</span>
              )}
              {totalProgress === 100 && (
                <span className="text-xs sm:text-sm font-medium text-green-600">Concluído!</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm sm:py-3 sm:pl-10 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
          />
        </div>

        {/* Modules by Category */}
        {searchTerm ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Resultados da Busca</h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {filteredModules.map((module, index) => (
                <ModuleCard 
                  key={module.id}
                  id={module.id}
                  title={module.name}
                  type={module.type || "autoconhecimento"}
                  progress={moduleProgress[module.id] || 0}
                  completed={completedModules[module.id] || false}
                  locked={isModuleLocked(index, module.id)}
                  description={module.description}
                  emoji={module.emoji}
                />
              ))}
            </div>
          </div>
        ) : (
          Object.entries(groupedModules).map(([type, typeModules]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold">{getModuleTypeTitle(type)}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {typeModules.map((module, moduleIdx) => {
                  // Find overall index in the complete modules list
                  const moduleIndex = modules.findIndex(m => m.id === module.id);
                  
                  return (
                    <div key={module.id} className="space-y-1">
                      <ModuleCard 
                        id={module.id}
                        title={module.name}
                        type={module.type || "autoconhecimento"}
                        progress={moduleProgress[module.id] || 0}
                        completed={completedModules[module.id] || false}
                        locked={isModuleLocked(moduleIndex, module.id)}
                        description={module.description}
                        emoji={module.emoji}
                      />
                      
                      {/* Show content count for unlocked modules - hide on very small screens */}
                      {!isMobile && !isModuleLocked(moduleIndex, module.id) && (
                        <div className="flex flex-wrap gap-1 px-1">
                          {getModuleContent(module.id).filter(p => p.type === 'video').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
                              <Video className="h-2.5 w-2.5 mr-0.5" />
                              {getModuleContent(module.id).filter(p => p.type === 'video').length}
                            </div>
                          )}
                          {getModuleContent(module.id).filter(p => p.type === 'text').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
                              <FileText className="h-2.5 w-2.5 mr-0.5" />
                              {getModuleContent(module.id).filter(p => p.type === 'text').length}
                            </div>
                          )}
                          {getModuleContent(module.id).filter(p => p.type === 'quiz').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
                              <HelpCircle className="h-2.5 w-2.5 mr-0.5" />
                              {getModuleContent(module.id).filter(p => p.type === 'quiz').length}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModulesPage;
