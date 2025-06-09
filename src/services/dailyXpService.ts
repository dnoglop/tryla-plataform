// src/services/xpService.ts

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RawRpcData {
  day: string;
  total_xp: number;
}

export interface FormattedWeeklyData {
  date: string;
  day: string;
  xp: number;
}

export const getFormattedWeeklyData = async (userId: string): Promise<FormattedWeeklyData[]> => {
  if (!userId) return [];
  
  try {
    // Chama a NOVA função RPC
    const { data, error } = await supabase.rpc('get_weekly_xp_history', {
      p_user_id: userId
    });
    
    if (error) {
      console.error("Erro ao buscar histórico de XP semanal via RPC:", error.message);
      toast.error("Não foi possível buscar os dados do gráfico.");
      throw error;
    }
    
    if (!data) return [];
    
    return data.map((item: RawRpcData) => {
      const parts = item.day.split(' ')[0].split('-');
      const [year, month, day] = parts.map(Number);
      const dateObject = new Date(Date.UTC(year, month - 1, day));
      const dayInitial = dateObject.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).charAt(0).toUpperCase();
      return { date: item.day, day: dayInitial, xp: item.total_xp };
    });

  } catch (err: any) {
    console.error("Exceção no serviço getFormattedWeeklyData:", err.message);
    throw new Error("Falha ao processar os dados de progresso semanal.");
  }
};