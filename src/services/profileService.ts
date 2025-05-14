
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  level?: number;
  xp?: number;
  streak_days?: number;
  bio?: string;
  linkedin_url?: string;
  phone?: string;
  birthday?: string;
  country?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        username, 
        full_name, 
        avatar_url, 
        created_at,
        updated_at,
        level,
        xp,
        streak_days,
        bio,
        linkedin_url
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error("Unexpected error fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  try {
    // Remove fields that don't exist in the database table
    const { phone, birthday, email, website, country, ...validUpdates } = updates;
    
    const { error } = await supabase
      .from('profiles')
      .update(validUpdates)
      .eq('id', userId);

    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error updating profile:", error);
    return false;
  }
};

/**
 * Atualiza a contagem de dias seguidos (streak) do usuário
 */
export const updateUserStreak = async (userId: string): Promise<boolean> => {
  try {
    // Buscar o perfil atual do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('streak_days, last_login')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Erro ao buscar perfil para streak:", profileError);
      return false;
    }
    
    // Verificar a última atividade do usuário
    const { data: lastActivity, error: activityError } = await supabase
      .from('user_phases')
      .select('completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1);
    
    if (activityError) {
      console.error("Erro ao buscar última atividade:", activityError);
      return false;
    }
    
    if (!lastActivity || lastActivity.length === 0) return true; // Sem atividades, manter streak atual
    
    const lastActivityDate = new Date(lastActivity[0].completed_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Verificar se a última atividade foi hoje
    const isToday = lastActivityDate.toDateString() === today.toDateString();
    
    // Verificar se a última atividade foi ontem
    const isYesterday = lastActivityDate.toDateString() === yesterday.toDateString();
    
    let newStreakDays = profile?.streak_days || 0;
    let shouldUpdate = false;
    
    // Se o usuário fez atividade hoje e não tinha feito login hoje ainda
    if (isToday && (!profile?.last_login || new Date(profile.last_login).toDateString() !== today.toDateString())) {
      newStreakDays += 1;
      shouldUpdate = true;
    } 
    // Se o usuário não fez atividade ontem nem hoje, resetar streak
    else if (!isYesterday && !isToday && newStreakDays > 0) {
      newStreakDays = 0;
      shouldUpdate = true;
    }
    
    // Atualizar streak_days e last_login
    if (shouldUpdate) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          streak_days: newStreakDays,
          last_login: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Erro ao atualizar streak days:", updateError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Erro inesperado ao atualizar streak days:", error);
    return false;
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Upload the image to storage
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);
      
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      throw new Error("Failed to get public URL for uploaded avatar");
    }

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return null;
  }
};

export const updateUserXp = async (userId: string, xpToAdd: number) => {
  try {
    // Fetch the current profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    if (!profileData) {
      throw new Error("Profile not found");
    }

    const currentXp = profileData.xp || 0;
    let currentLevel = profileData.level || 1;
    let newXp = currentXp + xpToAdd;
    let nextLevelXp = currentLevel * 100;

    // Check if the user has leveled up
    while (newXp >= nextLevelXp) {
      newXp -= nextLevelXp;
      currentLevel++;
      nextLevelXp = currentLevel * 100;
    }

    // Update the profile with new XP and level
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: currentLevel })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    return { newXp, newLevel: currentLevel };
  } catch (error) {
    console.error("Unexpected error updating user XP:", error);
    throw error;
  }
};

export const getUserBadges = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        badge_id,
        unlocked_at,
        badges:badge_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.badge_id,
      name: item.badges?.name || '',
      description: item.badges?.description || '',
      icon: item.badges?.icon || '🏆',
      unlocked: true,
      xp_reward: item.badges?.xp_reward || 0
    }));
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        achievement_id,
        unlocked_at,
        achievements:achievement_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.achievement_id,
      name: item.achievements?.name || '',
      description: item.achievements?.description || '',
      icon: item.achievements?.icon || '🏅',
      unlocked: true,
      xp_reward: item.achievements?.xp_reward || 0
    }));
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }
};
