
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string;
  linkedin_url: string;
  level?: number;
  xp?: number;
  streak_days?: number;
  last_login_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error("Exception while fetching profile:", error);
    return null;
  }
};

export const updateProfile = async (profile: Profile): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        linkedin_url: profile.linkedin_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", profile.id);
    
    if (error) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
      return false;
    }
    
    toast.success("Perfil atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error("Exception while updating profile:", error);
    toast.error("Falha ao atualizar perfil. Tente novamente.");
    return false;
  }
};

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);
    
    if (uploadError) {
      toast.error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      return null;
    }
    
    // Get public URL
    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    if (!data) return null;
    
    return data.publicUrl;
  } catch (error) {
    console.error("Exception while uploading avatar:", error);
    toast.error("Falha ao fazer upload da imagem. Tente novamente.");
    return null;
  }
};

export const updateLoginStreak = async (userId: string): Promise<number> => {
  try {
    // Obter o perfil atual do usuário
    const profile = await getProfile(userId);
    if (!profile) return 0;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastLogin = profile.last_login_date ? new Date(profile.last_login_date) : null;
    const lastLoginStr = lastLogin ? lastLogin.toISOString().split('T')[0] : null;
    
    let newStreakDays = profile.streak_days || 0;
    
    // Verifica se já logou hoje
    if (lastLoginStr === todayStr) {
      // Já logou hoje, mantém o streak atual
      return newStreakDays;
    }
    
    // Verifica se o último login foi ontem
    if (lastLogin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastLoginStr === yesterdayStr) {
        // Se o último login foi ontem, incrementa o streak
        newStreakDays += 1;
      } else {
        // Se o último login não foi ontem, reinicia o streak
        newStreakDays = 1;
      }
    } else {
      // Primeiro login
      newStreakDays = 1;
    }
    
    // Atualiza o streak e a data do último login
    const { error } = await supabase
      .from("profiles")
      .update({
        streak_days: newStreakDays,
        last_login_date: todayStr
      })
      .eq("id", userId);
    
    if (error) {
      console.error("Erro ao atualizar streak:", error);
      return 0;
    }
    
    return newStreakDays;
  } catch (error) {
    console.error("Exceção ao atualizar streak:", error);
    return 0;
  }
};

export const updateUserXp = async (userId: string, xpToAdd: number): Promise<number> => {
  try {
    // Obter o perfil atual do usuário
    const profile = await getProfile(userId);
    if (!profile) return 0;
    
    const currentXp = profile.xp || 0;
    const currentLevel = profile.level || 1;
    
    // Calcular novo XP
    const newXp = currentXp + xpToAdd;
    
    // Calcular se subiu de nível (cada nível requer XP = nível * 100)
    const xpForNextLevel = currentLevel * 100;
    let newLevel = currentLevel;
    
    if (newXp >= xpForNextLevel) {
      newLevel = Math.floor(newXp / 100) + 1;
      // Mostrar toast de subida de nível
      toast.success(`Parabéns! Você avançou para o Nível ${newLevel}! 🎉`, { 
        duration: 5000,
        icon: "🏆"
      });
    }
    
    // Atualizar XP e nível no banco de dados
    const { error } = await supabase
      .from("profiles")
      .update({
        xp: newXp,
        level: newLevel
      })
      .eq("id", userId);
    
    if (error) {
      console.error("Erro ao atualizar XP:", error);
      return currentXp;
    }
    
    return newXp;
  } catch (error) {
    console.error("Exceção ao atualizar XP:", error);
    return 0;
  }
};

export default {
  getProfile,
  updateProfile,
  uploadAvatar,
  updateLoginStreak,
  updateUserXp
};
