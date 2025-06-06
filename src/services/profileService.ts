
import { supabase } from "@/integrations/supabase/client";
import { addDailyXp } from "./dailyXpService";

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  linkedin_url?: string;
  xp?: number;
  level?: number;
  streak_days?: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao buscar perfil:', error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao atualizar perfil:', error);
    return null;
  }
};

export const updateUserXp = async (userId: string, xpToAdd: number): Promise<{ newXp: number; newLevel: number }> => {
  try {
    // Buscar XP atual
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar perfil atual:', fetchError);
      throw fetchError;
    }

    const currentXp = profile?.xp || 0;
    const newXp = currentXp + xpToAdd;
    const newLevel = Math.floor(newXp / 100) + 1;

    // Atualizar perfil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        xp: newXp, 
        level: newLevel 
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Erro ao atualizar XP do perfil:', updateError);
      throw updateError;
    }

    // Adicionar XP ao progresso diário
    await addDailyXp(userId, xpToAdd);

    return { newXp, newLevel };
  } catch (error) {
    console.error('Erro inesperado ao atualizar XP:', error);
    throw error;
  }
};

export const updateUserStreak = async (userId: string): Promise<number> => {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('last_login, streak_days')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar perfil para streak:', fetchError);
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile?.last_login;
    let newStreak = profile?.streak_days || 0;

    if (lastLogin !== today) {
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          last_login: today,
          streak_days: newStreak 
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar streak:', updateError);
        return profile?.streak_days || 0;
      }
    }

    return newStreak;
  } catch (error) {
    console.error('Erro inesperado ao atualizar streak:', error);
    return 0;
  }
};
