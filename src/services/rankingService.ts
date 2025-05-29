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
  created_at?: string;
}

export type RankingPeriod = 'all' | 'weekly' | 'monthly';

/**
 * Obtém o ranking de usuários ordenado por XP
 */
export const getUserRanking = async (period: RankingPeriod = 'all'): Promise<RankingUser[]> => {
  try {
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, xp, level, created_at');
    
    // Filtrar por período se necessário
    if (period === 'weekly') {
      // Obter data de 7 dias atrás
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      query = query.gte('created_at', lastWeek.toISOString());
    } else if (period === 'monthly') {
      // Obter data de 30 dias atrás
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      query = query.gte('created_at', lastMonth.toISOString());
    }
    
    const { data, error } = await query.order('xp', { ascending: false });

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
export const getUserRankPosition = async (userId: string, period: RankingPeriod = 'all'): Promise<number> => {
  try {
    const ranking = await getUserRanking(period);
    const userRank = ranking.find(user => user.id === userId);
    return userRank?.rank || 0;
  } catch (error) {
    console.error("Erro ao buscar posição no ranking:", error);
    return 0;
  }
};

/**
 * Atualiza o XP do usuário com base nos módulos concluídos e XP diário
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

    // Buscar todo o XP diário reivindicado pelo usuário
    const { data: dailyXpClaims, error: dailyXpError } = await supabase
      .from('daily_xp_claims')
      .select('xp_amount')
      .eq('user_id', userId);

    if (dailyXpError) {
      console.error("Erro ao buscar XP diário:", dailyXpError);
      return 0;
    }

    // Calcular XP total (50 XP por fase completada + XP diário)
    const phasesXp = (completedPhases?.length || 0) * 50;
    const dailyXp = dailyXpClaims?.reduce((total, claim) => total + (claim.xp_amount || 0), 0) || 0;
    const totalXp = phasesXp + dailyXp;

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

    // Calcular nível com base no XP total (100 XP por nível)
    const currentLevel = Math.floor(totalXp / 100) + 1;

    // Atualizar perfil com novo XP total e nível
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: totalXp, level: currentLevel })
      .eq('id', userId);

    if (updateError) {
      console.error("Erro ao atualizar XP do usuário:", updateError);
      return 0;
    }

    return totalXp;
  } catch (error) {
    console.error("Erro inesperado ao atualizar XP:", error);
    return 0;
  }
};