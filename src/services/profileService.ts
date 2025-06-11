import { supabase } from "@/integrations/supabase/client";

// A sua definição de tipo Profile está perfeita.
export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  xp: number | null;
  level: number | null;
  streak_days: number | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// As funções getProfile e updateProfile estão corretas.
export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil:", error.message);
    }
    return data;
  } catch (err) {
    console.error("Exceção ao buscar perfil:", err);
    return null;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) {
      console.error("Erro ao atualizar perfil:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exceção ao atualizar perfil:", err);
    return false;
  }
};


/**
 * --- FUNÇÃO CORRIGIDA ---
 * Garante que todos os avatares sejam enviados para a pasta 'avatars'.
 */
export const uploadAvatar = async (userId: string, file: File | Blob): Promise<string | null> => {
  if (!userId || !file) {
    console.error("ID do usuário ou arquivo não fornecido para upload.");
    return null;
  }

  try {
    const fileExt = file.type.split("/")[1] || 'jpeg';
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    
    // <<< ESTA É A LINHA CORRIGIDA E MAIS IMPORTANTE >>>
    // Garante que o caminho sempre comece com "avatars/", mantendo tudo organizado.
    const filePath = `avatars/${fileName}`;
    
    const bucketName = "profiles";

    console.log(`[uploadAvatar] Iniciando upload para: ${bucketName}/${filePath}`);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error("[uploadAvatar] ERRO DO SUPABASE DURANTE O UPLOAD:", uploadError);
      throw uploadError;
    }

    console.log("[uploadAvatar] Upload concluído com sucesso.");

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`[uploadAvatar] URL pública obtida: ${data.publicUrl}`);

    return data.publicUrl;

  } catch (error) {
    console.error("[uploadAvatar] Exceção final no processo de upload do avatar:", error);
    return null;
  }
};

export const updateUserStreak = async (userId: string): Promise<void> => {
  if (!userId) return;
  try {
    const { data: profile, error: profileError } = await supabase.from('profiles').select('last_login, streak_days').eq('id', userId).single();
    if (profileError) {
      console.error("Não foi possível buscar o perfil para atualizar o streak.", profileError.message);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

    const lastLoginDate = profile.last_login ? new Date(profile.last_login) : null;
    if (lastLoginDate) {
      lastLoginDate.setHours(0, 0, 0, 0);
    }
    
    // Se o último login foi hoje, não faz nada
    if (lastLoginDate && lastLoginDate.getTime() === today.getTime()) {
      return;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    let newStreak = 1; // Começa o streak em 1 por padrão
    if (lastLoginDate && lastLoginDate.getTime() === yesterday.getTime()) {
      // Se o último login foi ontem, incrementa o streak
      newStreak = (profile.streak_days || 0) + 1;
    }
    
    const { error: updateError } = await supabase.from('profiles').update({ 
        streak_days: newStreak, 
        last_login: new Date().toISOString() 
    }).eq('id', userId);

    if (updateError) {
        console.error("Erro ao salvar o novo streak no banco:", updateError.message);
    }
  } catch (error) {
    console.error("Exceção inesperada na função updateUserStreak:", error);
  }
};