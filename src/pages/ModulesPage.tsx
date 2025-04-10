
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import ProgressBar from "@/components/ProgressBar";

const ModulesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  
  const modules = [
    {
      id: 1,
      title: "Mestre de Si",
      type: "autoconhecimento" as const,
      progress: 75,
      completed: false,
    },
    {
      id: 2,
      title: "Olhar do Outro",
      type: "empatia" as const,
      progress: 25,
      completed: false,
    },
    {
      id: 3,
      title: "Mente Infinita",
      type: "growth" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 4,
      title: "Papo Reto",
      type: "comunicacao" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 5,
      title: "??????????",
      type: "futuro" as const,
      progress: 0,
      completed: false,
      locked: true,
    },
  ];

  const filteredModules = modules.filter((module) =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total progress
  useEffect(() => {
    const completedPercentage = modules.reduce(
      (sum, module) => sum + module.progress, 
      0
    ) / modules.length;
    
    setTotalProgress(Math.round(completedPercentage));
  }, [modules]);

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
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} {...module} />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModulesPage;
