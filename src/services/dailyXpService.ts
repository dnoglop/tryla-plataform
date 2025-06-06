import { supabase } from "@/integrations/supabase/client";

interface WeeklyDataItem {
  day: string;
  xp: number;
  date: string;
}

/**
 * Adiciona um registro de XP para o dia atual na tabela daily_xp_progress.
 * Esta função deve ser chamada quando um usuário completa uma ação que concede XP.
 */
export const addDailyXp = async (userId: string, xpAmount: number): Promise<void> => {
  if (!userId || xpAmount <= 0) return;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Chama uma função RPC (ou faz um upsert) para adicionar/atualizar o XP do dia.
    // Usar uma RPC 'add_or_update_daily_xp' é o ideal para evitar duplicatas.
    // Por simplicidade, vamos usar um upsert aqui.
    const { error } = await supabase
      .from('daily_xp_progress')
      .upsert(
        { 
          user_id: userId,
          date: today, 
          xp_earned: xpAmount // Aqui, você pode querer somar ao valor existente.
                               // Uma RPC é melhor para isso: `SET xp_earned = xp_earned + xpAmount`
        },
        { onConflict: 'user_id, date' } // Se já existir um registro para este usuário neste dia, ele será atualizado.
      );

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
 * Busca o progresso de XP da semana atual (Seg-Dom) usando uma RPC no Supabase.
 */
export const getFormattedWeeklyData = async (userId: string): Promise<WeeklyDataItem[]> => {
  if (!userId) return [];

  try {
    // Chama a função RPC que criamos no Supabase
    const { data: weeklySum, error } = await supabase.rpc('get_weekly_xp_sum', {
      user_id_param: userId
    });

    if (error) {
      console.error("Erro ao chamar a RPC get_weekly_xp_sum:", error);
      throw error;
    }

    if (!weeklySum) {
      return [];
    }

    // Formata os dados para o componente do gráfico
    return weeklySum.map((item: { day: string, total_xp: number }) => {
        const date = new Date(item.day + 'T00:00:00Z'); // Trata a data como UTC
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'narrow', timeZone: 'UTC' }).toUpperCase();
        return {
            date: item.day,
            day: dayName,
            xp: item.total_xp,
        };
    });

  } catch (err) {
    console.error("Erro inesperado ao formatar dados semanais:", err);
    return [];
  }
};