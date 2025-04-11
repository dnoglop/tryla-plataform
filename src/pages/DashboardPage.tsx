
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import UserLevel from "@/components/UserLevel";
import DailyTask from "@/components/DailyTask";
import { useToast } from "@/components/ui/use-toast";

interface Module {
  id: number;
  name: string;
  type: "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro";
  progress: number;
  completed: boolean;
  locked?: boolean;
  description?: string;
  emoji?: string;
}

const DashboardPage = () => {
  const { toast } = useToast();
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);

  // Fetch modules from localStorage
  useEffect(() => {
    const storedModules = localStorage.getItem("admin-modules");
    
    if (storedModules) {
      try {
        const parsedModules = JSON.parse(storedModules);
        
        // Map admin modules to the format expected by ModuleCard
        const formattedModules = parsedModules.map((module: any, index: number) => ({
          id: module.id,
          name: module.name,
          type: module.type || "autoconhecimento", 
          progress: 0,
          completed: false,
          locked: index > 1, // Lock all except first two modules
          description: module.description,
          emoji: module.emoji
        }));
        
        setModules(formattedModules);
      } catch (error) {
        console.error("Error parsing modules:", error);
        // Fallback to default modules if there's an error
        setModules(defaultModules);
      }
    } else {
      setModules(defaultModules);
    }
  }, []);

  const defaultModules: Module[] = [
    {
      id: 1,
      name: "Mestre de Si",
      type: "autoconhecimento",
      progress: 75,
      completed: false,
    },
    {
      id: 2,
      name: "Olhar do Outro",
      type: "empatia",
      progress: 25,
      completed: false,
    },
    {
      id: 3,
      name: "Mente Infinita",
      type: "growth",
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 4,
      name: "Papo Reto",
      type: "comunicacao",
      progress: 0,
      completed: false,
      locked: true,
    },
    {
      id: 5,
      name: "??????????",
      type: "futuro",
      progress: 0,
      completed: false,
      locked: true,
    },
  ];

  const handleDailyTask = () => {
    if (!dailyCompleted) {
      setDailyCompleted(true);
      toast({
        title: "Missão do Dia completada!",
        description: "Você ganhou +50 XP! 🔥",
        duration: 3000,
      });
    }
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="🗺️ Painel da Jornada" showBackButton={false} />

      <div className="container px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="Foto de perfil"
              className="h-14 w-14 rounded-full object-cover border-2 border-trilha-orange"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-trilha-orange text-xs font-bold text-white shadow-sm">
              5
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-bold">Olá, Explorador(a)!</h2>
            <UserLevel level={5} currentXP={350} nextLevelXP={500} />
          </div>
        </div>

        <DailyTask 
          completed={dailyCompleted}
          xpReward={50}
          onClick={handleDailyTask}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Sua Trilha</h2>
            <Link to="/modulos" className="text-sm font-medium text-trilha-orange">
              Ver tudo
            </Link>
          </div>

          <div className="grid gap-4">
            {modules.slice(0, 3).map((module) => (
              <ModuleCard 
                key={module.id}
                id={module.id}
                title={module.name}
                type={module.type}
                progress={module.progress}
                completed={module.completed}
                locked={module.locked}
                description={module.description}
                emoji={module.emoji}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/recompensas"
            className="card-trilha flex items-center gap-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-trilha-orange bg-opacity-10 text-2xl">
              🏆
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Central de Recompensas</h3>
              <p className="text-sm text-gray-600">
                Você tem 3 emblemas novos para desbloquear!
              </p>
            </div>
            <Zap className="h-5 w-5 animate-pulse text-trilha-orange" />
          </Link>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default DashboardPage;
