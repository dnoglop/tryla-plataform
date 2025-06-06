
import { supabase } from "@/integrations/supabase/client";

export interface DailyXpProgress {
  id: string;
  user_id: string;
  date: string;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

/**
 * Adiciona XP para o dia atual do usuário
 */
export const addDailyXp = async (userId: string, xpAmount: number): Promise<void> => {
  try {
    const { error } = await supabase.rpc('add_daily_xp', {
      user_id_param: userId,
      xp_amount: xpAmount
    });

    if (error) {
      console.error('Erro ao adicionar XP diário:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro inesperado ao adicionar XP diário:', error);
    throw error;
  }
};

/**
 * Busca o progresso de XP dos últimos 7 dias do usuário
 */
export const getWeeklyXpProgress = async (userId: string): Promise<DailyXpProgress[]> => {
  try {
    // Calcular as datas dos últimos 7 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 7 dias incluindo hoje

    const { data, error } = await supabase
      .from('daily_xp_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar progresso semanal:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro inesperado ao buscar progresso semanal:', error);
    throw error;
  }
};

/**
 * Gera dados dos últimos 7 dias, preenchendo dias sem XP com 0
 */
export const getFormattedWeeklyData = async (userId: string) => {
  try {
    const xpData = await getWeeklyXpProgress(userId);
    
    // Criar array dos últimos 7 dias
    const weeklyData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Encontrar XP para este dia
      const dayData = xpData.find(item => item.date === dateString);
      const xpEarned = dayData ? dayData.xp_earned : 0;
      
      // Obter nome do dia da semana abreviado
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'narrow' }).toUpperCase();
      
      weeklyData.push({
        day: dayName,
        xp: xpEarned,
        date: dateString
      });
    }
    
    return weeklyData;
  } catch (error) {
    console.error('Erro ao formatar dados semanais:', error);
    return [];
  }
};
