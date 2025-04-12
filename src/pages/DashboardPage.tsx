import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import ModuleCard from "@/components/ModuleCard";
import UserLevel from "@/components/UserLevel";
import DailyTask from "@/components/DailyTask";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from '@tanstack/react-query';
import { getModules, Module } from "@/services/moduleService";

const DashboardPage = () => {
  const { toast } = useToast();
  const [dailyCompleted, setDailyCompleted] = useState(false);

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
    select: (data) => data.map((module, index) => ({
      ...module,
      progress: index === 0 ? 75 : index === 1 ? 25 : 0,
      completed: false,
      locked: index > 1,
    })),
  });

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

  if (isLoading) {
    return (
      <div className="pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

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
            <UserLevel level={5} xp={350} nextLevelXp={500} />
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
                type={module.type || "autoconhecimento"}
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
