
import { useState, useEffect } from "react";
import { Search, Video, FileText, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import ProgressBar from "@/components/ProgressBar";
import { useQuery } from '@tanstack/react-query';
import { getModules, getPhasesByModuleId, Module, Phase } from "@/services/moduleService";

const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  const [modulePhases, setModulePhases] = useState<Record<number, Phase[]>>({});
  
  // Fetch modules from Supabase
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    select: (data) => data.map((module) => ({
      ...module,
      progress: 0, // Default progress, will be updated later if needed
      completed: false
    })),
  });

  // Calculate total progress
  useEffect(() => {
    const completedPercentage = modules.reduce(
      (sum, module) => sum + (module.progress || 0), 
      0
    ) / (modules.length || 1);
    
    setTotalProgress(Math.round(completedPercentage));
  }, [modules]);

  // Filtrar módulos com base na busca
  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Helper function to get module content
  const getModuleContent = (moduleId: number) => {
    return modulePhases[moduleId] || [];
  };

  // Determine if a module should be locked (for this example: lock all after the 2nd)
  const isModuleLocked = (index: number) => index > 1;

  if (isLoadingModules) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="🎯 Base de Treinamento" />

      <div className="container px-4 py-6 space-y-6">
        <div className="card-trilha p-4">
          <h2 className="mb-2 font-bold">Progresso Total</h2>
          <ProgressBar progress={totalProgress} />
          <p className="mt-1 text-right text-sm text-gray-600">{totalProgress}% completo</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
          />
        </div>

        <div className="space-y-4">
          {filteredModules.map((module, index) => (
            <div key={module.id} className="space-y-2">
              <ModuleCard 
                id={module.id}
                title={module.name}
                type={module.type || "autoconhecimento"}
                progress={module.progress || 0}
                completed={module.completed || false}
                locked={isModuleLocked(index)}
                description={module.description}
                emoji={module.emoji}
              />
              
              {/* Show content count for each module */}
              {!isModuleLocked(index) && (
                <div className="ml-4 flex space-x-3 text-xs text-gray-500">
                  {getModuleContent(module.id).filter(p => p.type === 'video').length > 0 && (
                    <div className="flex items-center">
                      <Video className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'video').length} vídeos
                    </div>
                  )}
                  {getModuleContent(module.id).filter(p => p.type === 'text').length > 0 && (
                    <div className="flex items-center">
                      <FileText className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'text').length} textos
                    </div>
                  )}
                  {getModuleContent(module.id).filter(p => p.type === 'quiz').length > 0 && (
                    <div className="flex items-center">
                      <HelpCircle className="h-3 w-3 mr-1" />
                      {getModuleContent(module.id).filter(p => p.type === 'quiz').length} quizes
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModulesPage;
