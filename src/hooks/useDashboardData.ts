
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProfile, Profile, updateUserStreak } from '@/services/profileService';
import { getModules, isModuleCompleted } from '@/services/moduleService';
import { getUserRanking } from '@/services/rankingService';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      // 1. Obter usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }
      
      // 2. Atualizar o streak primeiro
      await updateUserStreak(user.id);

      // 3. Buscar todos os dados em paralelo para máxima eficiência
      const [userProfile, allModules, allTimeRanking] = await Promise.all([
        getProfile(user.id),
        getModules(),
        getUserRanking("all")
      ]);

      if (!userProfile || !allModules) {
        throw new Error("Não foi possível carregar os dados essenciais.");
      }

      // 4. Calcular módulos completados
      const completionPromises = allModules.map(module => isModuleCompleted(user.id, module.id));
      const completionResults = await Promise.all(completionPromises);
      const completedModulesCount = completionResults.filter(Boolean).length;
      
      // 5. Encontrar a posição do usuário no ranking
      const userRankIndex = allTimeRanking?.findIndex(rankUser => rankUser.id === user.id);
      const userRank = userRankIndex !== -1 && userRankIndex !== undefined ? userRankIndex + 1 : 0;

      // 6. Retornar um único objeto com todos os dados
      return {
        userId: user.id,
        profile: userProfile,
        completedModulesCount,
        userRank,
      };
    },
    staleTime: 5 * 60 * 1000, // Considerar os dados "frescos" por 5 minutos
    retry: 1,
  });
};
