import { supabase } from "@/integrations/supabase/client";

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

export type RankingPeriod = "all" | "weekly" | "monthly";

/**
 * Obtém o ranking de usuários ordenado por XP
 */
export const getUserRanking = async (
  period: RankingPeriod = "all",
): Promise<RankingUser[]> => {
  try {
    let query = supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, xp, level, created_at");

    // Filtrar por período se necessário
    if (period === "weekly") {
      // Obter data de 7 dias atrás
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      query = query.gte("created_at", lastWeek.toISOString());
    } else if (period === "monthly") {
      // Obter data de 30 dias atrás
      const lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      query = query.gte("created_at", lastMonth.toISOString());
    }

    const { data, error } = await query.order("xp", { ascending: false });

    if (error) {
      console.error("Erro ao buscar ranking de usuários:", error);
      return [];
    }

    // Adiciona a posição no ranking para cada usuário
    return (data || []).map((user, index) => ({
      ...user,
      rank: index + 1,
      xp: user.xp || 0,
      level: user.level || 1,
    })) as RankingUser[];
  } catch (error) {
    console.error("Erro inesperado ao buscar ranking:", error);
    return [];
  }
};

export const getUserRankPosition = async (
  userId: string,
  period: RankingPeriod = "all",
): Promise<number> => {
  try {
    // Reutiliza a função de ranking otimizada.
    const ranking = await getUserRanking(period);
    const userRank = ranking.find((user) => user.id === userId);
    return userRank?.rank || 0;
  } catch (error) {
    console.error("Erro ao buscar posição no ranking:", error);
    return 0;
  }
};
