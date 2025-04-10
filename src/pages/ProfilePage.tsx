
import { useState } from "react";
import { LogOut, Mail, Link as LinkIcon, Settings } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import UserLevel from "@/components/UserLevel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user] = useState({
    name: "Ana Silva",
    username: "anasilva23",
    avatar: "https://i.pravatar.cc/150?img=5",
    level: 5,
    currentXP: 350,
    nextLevelXP: 500,
    bio: "Estudante do 2º ano do ensino médio | Apaixonada por tecnologia e música",
    completedModules: 1,
    completedPhases: 3,
    totalBadges: 3,
    earnedBadges: 2,
    joinDate: "Dez 2024",
  });

  const badges = [
    { icon: "🚀", name: "Primeiro Passo" },
    { icon: "👥", name: "Explorador(a) Social" },
    { icon: "🎯", name: "Fera nos Quizzes" },
  ];

  const achievements = [
    { title: "Módulos Completos", value: user.completedModules, total: 5 },
    { title: "Fases Completas", value: user.completedPhases, total: 20 },
    { title: "Emblemas", value: user.earnedBadges, total: user.totalBadges },
  ];

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title="👤 Seu Perfil" />

      <div className="bg-gradient-to-b from-trilha-orange to-amber-400 py-6 relative">
        <div className="container px-4">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 rounded-full border-4 border-white object-cover"
            />
            <div className="flex-1 text-white">
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-white/80">@{user.username}</p>
            </div>
            <button
              onClick={() => {}}
              className="rounded-full bg-white/20 p-2"
            >
              <Settings className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="mt-4">
            <UserLevel 
              level={user.level} 
              currentXP={user.currentXP} 
              nextLevelXP={user.nextLevelXP} 
              showLevel={false}
            />
            <div className="mt-1 flex justify-between text-xs text-white/90">
              <span>Nível {user.level}</span>
              <span>Nível {user.level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6 -mt-4">
        <div className="rounded-xl bg-white p-4 shadow-sm relative z-10">
          <div className="mb-4">
            <h2 className="font-bold">Sobre mim</h2>
            <p className="text-sm text-gray-600 mt-1">{user.bio}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">
              <Mail className="h-3 w-3 text-gray-500" />
              <span>Na Trilha desde {user.joinDate}</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs">
              <LinkIcon className="h-3 w-3 text-gray-500" />
              <span>LinkedIn</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-bold mb-4">Meus Emblemas</h2>
          <div className="flex justify-between">
            {badges.map((badge, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-trilha-orange/10 text-2xl shadow-inner">
                  {badge.icon}
                </div>
                <span className="mt-1 text-xs text-center">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="font-bold mb-4">Conquistas</h2>
          <div className="space-y-4">
            {achievements.map((achievement, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{achievement.title}</span>
                  <span className="text-sm font-medium text-trilha-orange">
                    {achievement.value}/{achievement.total}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-trilha-orange"
                    style={{
                      width: `${(achievement.value / achievement.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Separator className="my-6" />
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="w-full flex items-center gap-2 text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
