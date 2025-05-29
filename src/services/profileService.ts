import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      .from("profiles")
      .select(
        `
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
      `,
      )
      .eq("id", userId)
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
  const firstName = fullName.split(" ")[0].toLowerCase();

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
      .from("profiles")
      .select("username, full_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(
        "Erro ao buscar perfil para verificação de username:",
        profileError,
      );
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
        .from("profiles")
        .update({ username })
        .eq("id", userId);

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

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
): Promise<boolean> => {
  try {
    // Remove fields that don't exist in the database table
    const { phone, birthday, email, website, country, ...validUpdates } =
      updates;

    const { error } = await supabase
      .from("profiles")
      .update(validUpdates)
      .eq("id", userId);

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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("streak_days, last_login")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Erro ao buscar perfil para streak:", profileError);
      return false;
    }

    // Criar uma nova instância de Date para hoje
    const today = new Date();
    
    // Processar a data do último login
    // Vamos preservar o valor original do banco de dados para comparação
    const lastLoginRaw = profile?.last_login;
    const lastLogin = profile?.last_login ? new Date(profile.last_login) : null;
    
    if (!lastLogin) {
      // Se o usuário não tem last_login, definir streak como 1
      await supabase
        .from("profiles")
        .update({
          streak_days: 1,
          last_login: today.toISOString(),
        })
        .eq("id", userId);
      return true;
    }
    
    // Extrair as datas em formato YYYY-MM-DD para comparação
    const todayFormatted = today.toISOString().split('T')[0];
    const lastLoginFormatted = lastLoginRaw.split('T')[0];
    
    // Adicionar logs para depuração
    console.log("Valores de data para comparação:");
    console.log("Today (raw):", today);
    console.log("Last Login (raw):", lastLogin);
    console.log("Today (formatted):", todayFormatted);
    console.log("Last Login (formatted):", lastLoginFormatted);
    console.log("Raw last_login from DB:", lastLoginRaw);
    console.log("É o mesmo dia?", todayFormatted === lastLoginFormatted);
    
    // Verificar se o último login foi hoje (comparando as strings de data)
    if (todayFormatted === lastLoginFormatted) {
      // Se o último login foi hoje, não fazer nada
      console.log("CONDIÇÃO VERDADEIRA: Último login foi hoje!");
      return true;
    }
    
    console.log("CONDIÇÃO FALSA: Último login NÃO foi hoje!");
    
    // Se chegou aqui, é um novo dia
    let newStreakDays = profile?.streak_days || 0;
    
    // Criar uma data para ontem
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];
    
    console.log("Yesterday (formatted):", yesterdayFormatted);
    console.log("É ontem?", lastLoginFormatted === yesterdayFormatted);
    
    // Verificar se o último login foi ontem (comparando as strings de data)
    if (lastLoginFormatted === yesterdayFormatted) {
      // Se o último login foi ontem, incrementar streak
      console.log("Incrementando streak porque último login foi ontem");
      newStreakDays += 1;
    } else {
      // Reiniciar streak se não acessado ontem
      console.log("Reiniciando streak porque último login não foi ontem");
      newStreakDays = 1;
    }
    
    console.log("Novo valor de streak:", newStreakDays);
    
    // Atualizar o perfil com o novo streak e o timestamp atual
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        streak_days: newStreakDays,
        last_login: today.toISOString(),
      })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Erro ao atualizar streak:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erro inesperado ao atualizar streak days:", error);
    return false;
  }
};

export const uploadAvatar = async (
  userId: string,
  file: File,
): Promise<string | null> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload the image to storage
    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

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
      .from("profiles")
      .select("xp, level")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    if (!profileData) {
      throw new Error("Profile not found");
    }

    const currentXp = profileData.xp || 0;
    const newXp = currentXp + xpToAdd;

    // Calculate new level based on 100 XP per level
    const newLevel = Math.floor(newXp / 100) + 1;

    // Update the profile with new XP and level
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ xp: newXp, level: newLevel })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      throw updateError;
    }

    return { newXp, newLevel };
  } catch (error) {
    console.error("Unexpected error updating user XP:", error);
    throw error;
  }
};

export const getUserBadges = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        badge_id,
        unlocked_at,
        badges:badge_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `,
      )
      .eq("user_id", userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.badge_id,
      name: item.badges?.name || "",
      description: item.badges?.description || "",
      icon: item.badges?.icon || "🏆",
      unlocked: true,
      xp_reward: item.badges?.xp_reward || 0,
    }));
  } catch (error) {
    console.error("Error fetching user badges:", error);
    return [];
  }
};

export const getUserAchievements = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        achievement_id,
        unlocked_at,
        achievements:achievement_id (
          id,
          name,
          description,
          icon,
          xp_reward
        )
      `,
      )
      .eq("user_id", userId);

    if (error) throw error;

    // Transform the data to match the expected format
    return (data || []).map((item: any) => ({
      id: item.achievement_id,
      name: item.achievements?.name || "",
      description: item.achievements?.description || "",
      icon: item.achievements?.icon || "🏅",
      unlocked: true,
      xp_reward: item.achievements?.xp_reward || 0,
    }));
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    return [];
  }
};
