import { useState, useEffect } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Search, Award, Trophy, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BadgeItem from "@/components/BadgeItem";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getUserBadges, getUserAchievements, updateUserXp } from "@/services/profileService";
import UserLevel from "@/components/UserLevel";

const RewardsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  // Fetch badges
  const { 
    data: badges = [], 
    isLoading: isLoadingBadges
  } = useQuery({
    queryKey: ['user-badges', userId],
    queryFn: () => userId ? getUserBadges(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  // Fetch achievements
  const { 
    data: achievements = [], 
    isLoading: isLoadingAchievements
  } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: () => userId ? getUserAchievements(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  const filteredBadges = badges.filter((badge) =>
    badge.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAchievements = achievements.filter((achievement) =>
    achievement.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = isLoadingBadges || isLoadingAchievements;

  // Dados de exemplo para o leaderboard
  const leaderboardData = [
    { id: 1, name: "Maria", rank: 1, avatar: "👩‍🦰", xp: 945 },
    { id: 2, name: "João", rank: 2, avatar: "👨‍🦱", xp: 872 },
    { id: 3, name: "Ana", rank: 3, avatar: "👩‍🦳", xp: 765 },
    { id: 4, name: "Carlos", rank: 4, avatar: "👨‍🦲", xp: 723 },
    { id: 5, name: "Paula", rank: 5, avatar: "👩", xp: 640 },
    { id: 6, name: "Fernando", rank: 6, avatar: "👨", xp: 596 },
  ];

  const top3 = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3);

  return (
    <div className="pb-20 min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#e36322] px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-white text-lg font-semibold">🏆 Conquistas e Recompensas</h2>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Buscar conquistas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border-0 text-white placeholder-white/60 rounded-full py-2 pl-9 pr-4 focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
        </div>
      </div>

      <div className="container px-4 py-5 space-y-6">
        {/* Tabs for Leaderboard and Achievements */}
        <Tabs defaultValue="leaderboard">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="leaderboard" className="flex-1">Ranking</TabsTrigger>
            <TabsTrigger value="achievements" className="flex-1">Conquistas</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-2">
            {/* Period Selection */}
            <div className="flex gap-2 mb-6">
              <button 
                className={`rounded-full px-4 py-1.5 text-sm ${selectedPeriod === 'weekly' ? 'bg-[#e36322] text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setSelectedPeriod('weekly')}
              >
                Semanal
              </button>
              <button 
                className={`rounded-full px-4 py-1.5 text-sm ${selectedPeriod === 'monthly' ? 'bg-[#e36322] text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setSelectedPeriod('monthly')}
              >
                Mensal
              </button>
              <button 
                className={`rounded-full px-4 py-1.5 text-sm ${selectedPeriod === 'alltime' ? 'bg-[#e36322] text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setSelectedPeriod('alltime')}
              >
                Todos os Tempos
              </button>
            </div>
            
            {/* Top 3 Users */}
            <div className="flex justify-between items-end mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center w-1/3">
                <div className="w-16 h-16 rounded-full bg-[#e36322]/80 flex items-center justify-center text-white text-2xl mb-1 border-2 border-white shadow-lg">
                  {top3[1]?.avatar || "👤"}
                </div>
                <p className="font-medium text-sm text-center">{top3[1]?.name || "Usuário"}</p>
                <p className="text-xs text-[#e36322] font-bold">{top3[1]?.xp || 0} XP</p>
                <div className="bg-[#e36322]/80 w-full h-20 rounded-t-2xl mt-2 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
              </div>
              
              {/* 1st Place */}
              <div className="flex flex-col items-center w-1/3">
                <div className="w-20 h-20 rounded-full bg-[#e36322] flex items-center justify-center text-white text-3xl mb-1 border-2 border-white shadow-lg">
                  {top3[0]?.avatar || "👤"}
                </div>
                <p className="font-medium text-base text-center">{top3[0]?.name || "Usuário"}</p>
                <p className="text-sm text-[#e36322] font-bold">{top3[0]?.xp || 0} XP</p>
                <div className="bg-[#e36322] w-full h-28 rounded-t-2xl mt-2 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">1</span>
                </div>
              </div>
              
              {/* 3rd Place */}
              <div className="flex flex-col items-center w-1/3">
                <div className="w-16 h-16 rounded-full bg-[#e36322]/60 flex items-center justify-center text-white text-2xl mb-1 border-2 border-white shadow-lg">
                  {top3[2]?.avatar || "👤"}
                </div>
                <p className="font-medium text-sm text-center">{top3[2]?.name || "Usuário"}</p>
                <p className="text-xs text-[#e36322] font-bold">{top3[2]?.xp || 0} XP</p>
                <div className="bg-[#e36322]/60 w-full h-16 rounded-t-2xl mt-2 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
              </div>
            </div>
            
            {/* Other Rankings */}
            <div className="space-y-3 mt-6">
              {others.map((user) => (
                <div key={user.id} className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <div className="w-6 text-center text-gray-500 font-medium mr-3">
                    {user.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#FFDCCC] flex items-center justify-center text-lg mr-3">
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div className="text-sm font-bold text-[#e36322]">
                    {user.xp} XP
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="mt-2">
            {userId && <UserLevel userId={userId} className="mb-6" />}
            
            <div className="mb-6">
              <h3 className="font-bold text-[#e36322] mb-3 flex items-center">
                <Trophy className="h-5 w-5 mr-2" /> Conquistas
              </h3>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse">Carregando...</div>
                </div>
              ) : filteredAchievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => (
                    <BadgeItem
                      key={achievement.id}
                      name={achievement.name}
                      description={achievement.description}
                      icon={achievement.icon}
                      unlocked={achievement.unlocked}
                      xpReward={achievement.xp_reward}
                      type="achievement"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "Nenhuma conquista encontrada com este termo."
                      : "Ainda não há conquistas disponíveis."
                    }
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-[#e36322] mb-3 flex items-center">
                <Award className="h-5 w-5 mr-2" /> Insígnias
              </h3>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse">Carregando...</div>
                </div>
              ) : filteredBadges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredBadges.map((badge) => (
                    <BadgeItem
                      key={badge.id}
                      name={badge.name}
                      description={badge.description}
                      icon={badge.icon}
                      unlocked={badge.unlocked}
                      type="badge"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {searchTerm 
                      ? "Nenhuma insígnia encontrada com este termo."
                      : "Ainda não há insígnias disponíveis."
                    }
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RewardsPage;
