
import { useState } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import UserLevel from "@/components/UserLevel";
import DailyTask from "@/components/DailyTask";
import { useToast } from "@/components/ui/use-toast";

const DashboardPage = () => {
  const { toast } = useToast();
  const [dailyCompleted, setDailyCompleted] = useState(false);

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
            {modules.map((module) => (
              <ModuleCard key={module.id} {...module} />
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
