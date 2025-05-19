
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

/**
 * Gera um nome de usuário automático baseado no primeiro nome + 4 dígitos aleatórios
 */
export const generateUsername = (fullName: string): string => {
  // Extrair o primeiro nome
  const firstName = fullName.split(' ')[0].toLowerCase();
  
  // Gerar 4 dígitos aleatórios
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
  // Retornar o nome de usuário no formato: primeironomeDDDD
  return `${firstName}${randomDigits}`;
};

/**
 * Verifica e atualiza o username do usuário se necessário
 * Esta função garante que todo usuário tenha um username no formato: primeironomeDDDD
 */
export const ensureUsername = async (userId: string): Promise<boolean> => {
  try {
    // Buscar o perfil atual do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error("Erro ao buscar perfil para verificação de username:", profileError);
      return false;
    }
    
    // Se o usuário já tem um username, não fazer nada
    if (profile?.username) {
      return true;
    }
    
    // Se não tem username mas tem nome completo, gerar um username
    if (profile?.full_name) {
      const username = generateUsername(profile.full_name);
      
      // Atualizar o perfil com o novo username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Erro ao atualizar username:", updateError);
        return false;
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Erro inesperado ao verificar username:", error);
    return false;
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
    
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // Se o usuário não tem last_login, definir streak como 1 (primeiro dia)
    if (!profile?.last_login) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          streak_days: 1,
          last_login: today.toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Erro ao inicializar streak days:", updateError);
        return false;
      }
      return true;
    }
    
    // Converter last_login para objeto Date
    const lastLogin = new Date(profile.last_login);
    const lastLoginStr = lastLogin.toDateString();
    
    let newStreakDays = profile?.streak_days || 0;
    let shouldUpdate = false;
    
    // Se o último login foi hoje, não fazer nada
    if (lastLoginStr === todayStr) {
      return true;
    }
    // Se o último login foi ontem, incrementar streak
    else if (lastLoginStr === yesterdayStr) {
      newStreakDays += 1;
      shouldUpdate = true;
    }
    // Se o último login foi há mais de um dia, mas o usuário está acessando hoje, reiniciar streak
    else {
      newStreakDays = 1; // Reiniciar streak com 1 (dia atual)
      shouldUpdate = true;
    }
    
    // Atualizar streak_days e last_login
    if (shouldUpdate) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          streak_days: newStreakDays,
          last_login: today.toISOString()
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