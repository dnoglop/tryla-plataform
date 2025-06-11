import { supabase } from "@/integrations/supabase/client";

// Exportar o tipo Profile baseado na tabela profiles do Supabase
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

export const uploadAvatar = async (userId: string, file: File | Blob): Promise<string | null> => {
  if (!userId || !file) {
    console.error("ID do usuário ou arquivo não fornecido para upload.");
    return null;
  }

  try {
    const fileExt = file.type.split("/")[1] || 'jpeg';
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    const bucketName = "profiles";

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error("[uploadAvatar] ERRO DO SUPABASE DURANTE O UPLOAD:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;

  } catch (error) {
    console.error("[uploadAvatar] Exceção final no processo de upload do avatar:", error);
    return null;
  }
};


/**
 * --- VERSÃO FINAL E CORRIGIDA ---
 * Verifica e atualiza o streak usando comparação de strings de data (AAAA-MM-DD),
 * o que é imune a problemas de fuso horário e garante a atualização apenas uma vez por dia.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} - Retorna `true` se o streak foi modificado, `false` caso contrário.
 */
export const updateUserStreak = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('last_login, streak_days')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error("Streak: Não foi possível buscar o perfil.", profileError.message);
            return false;
        }

        // Pega a data de hoje como uma string 'AAAA-MM-DD' no fuso horário UTC.
        const todayStr = new Date().toISOString().split('T')[0];
        
        // CASO 1: Primeiro login do usuário.
        if (!profile.last_login) {
            console.log("Streak: Primeiro login detectado. Iniciando streak em 1.");
            const { error } = await supabase
                .from('profiles')
                .update({ streak_days: 1, last_login: new Date().toISOString() })
                .eq('id', userId);
            
            if (error) {
                console.error("Streak: Erro ao iniciar o primeiro streak.", error.message);
                return false;
            }
            return true;
        }

        // Pega a data do último login como uma string 'AAAA-MM-DD'.
        const lastLoginStr = profile.last_login.split('T')[0];

        // CASO 2: O usuário já fez login no dia de hoje.
        // Esta comparação de strings é a chave para a correção.
        if (todayStr === lastLoginStr) {
            console.log(`Streak: Login já registrado hoje (${todayStr}). Nenhuma ação necessária.`);
            return false; // A contagem para aqui, como esperado.
        }

        // CASO 3: O usuário está fazendo login em um novo dia.
        // Agora, calculamos a diferença para ver se o streak continua ou quebra.
        const today = new Date(todayStr); // Cria a data de hoje à meia-noite UTC
        const lastLoginDate = new Date(lastLoginStr); // Cria a data do último login à meia-noite UTC
        
        const diffTime = today.getTime() - lastLoginDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let newStreak: number;
        if (diffDays === 1) {
            // Último login foi ontem, continua o streak.
            newStreak = (profile.streak_days || 0) + 1;
            console.log(`Streak: Continuando para ${newStreak} dias.`);
        } else {
            // Streak quebrado (mais de 1 dia de diferença). Reseta para 1.
            newStreak = 1;
            console.log(`Streak: Quebrado (${diffDays} dias de diferença). Resetando para 1.`);
        }
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
                streak_days: newStreak, 
                last_login: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Streak: Erro ao salvar o novo streak no banco:", updateError.message);
            return false;
        }
        
        return true;

    } catch (error) {
        console.error("Exceção inesperada na função updateUserStreak:", error);
        return false;
    }
};