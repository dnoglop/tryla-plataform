
import { useState, useEffect } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import { Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BadgeItem from "@/components/BadgeItem";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getUserBadges, getUserAchievements, updateUserXp } from "@/services/profileService";
import UserLevel from "@/components/UserLevel";

const RewardsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  return (
    <div className="pb-20 min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[#E36322] px-4 pt-6 pb-4 rounded-b-3xl">
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
        {/* User Level Section */}
        {userId && <UserLevel userId={userId} className="mb-6" />}

        {/* Tabs for badges and achievements */}
        <Tabs defaultValue="achievements">
          <TabsList className="w-full">
            <TabsTrigger value="achievements" className="flex-1">Conquistas</TabsTrigger>
            <TabsTrigger value="badges" className="flex-1">Insígnias</TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="mt-6">
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
          </TabsContent>

          <TabsContent value="badges" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default RewardsPage;
