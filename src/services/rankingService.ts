import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./profileService";

export interface RankingUser {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  xp: number;
  level: number;
  rank: number;
}

/**
 * Obtém o ranking de usuários ordenado por XP
 */
export const getUserRanking = async (): Promise<RankingUser[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, xp, level')
      .order('xp', { ascending: false });

    if (error) {
      console.error("Erro ao buscar ranking de usuários:", error);
      return [];
    }

    // Adiciona a posição no ranking para cada usuário
    return (data || []).map((user, index) => ({
      ...user,
      rank: index + 1,
      xp: user.xp || 0,
      level: user.level || 1
    })) as RankingUser[];
  } catch (error) {
    console.error("Erro inesperado ao buscar ranking:", error);
    return [];
  }
};

/**
 * Obtém a posição do usuário no ranking
 */
export const getUserRankPosition = async (userId: string): Promise<number> => {
  try {
    const ranking = await getUserRanking();
    const userRank = ranking.find(user => user.id === userId);
    return userRank?.rank || 0;
  } catch (error) {
    console.error("Erro ao buscar posição no ranking:", error);
    return 0;
  }
};

/**
 * Atualiza o XP do usuário com base nos módulos concluídos
 */
export const updateUserXpFromModules = async (userId: string): Promise<number> => {
  try {
    // Buscar todas as fases completadas pelo usuário
    const { data: completedPhases, error: phasesError } = await supabase
      .from('user_phases')
      .select('phase_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (phasesError) {
      console.error("Erro ao buscar fases completadas:", phasesError);
      return 0;
    }

    // Calcular XP total (50 XP por fase completada)
    const totalXp = (completedPhases?.length || 0) * 50;

    // Buscar perfil atual
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      return 0;
    }

    // Calcular nível com base no XP total
    let currentLevel = profile?.level || 1;
    let remainingXp = totalXp;
    let nextLevelXp = currentLevel * 100;

    // Calcular novo nível
    while (remainingXp >= nextLevelXp) {
      remainingXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = currentLevel * 100;
    }

    // Atualizar perfil com novo XP e nível
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: remainingXp, level: currentLevel })
      .eq('id', userId);

    if (updateError) {
      console.error("Erro ao atualizar XP do usuário:", updateError);
      return 0;
    }

    return remainingXp;
  } catch (error) {
    console.error("Erro inesperado ao atualizar XP:", error);
    return 0;
  }
};