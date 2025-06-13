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

/**
 * Busca o perfil completo de um único usuário.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<Profile | null>} - Retorna o objeto do perfil ou null.
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
    if (!userId) return null;
    try {
        // select('*') aqui está correto, pois estamos buscando todos os dados de um único perfil.
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        // Ignora o erro 'PGRST116' que significa "nenhuma linha encontrada", o que é um resultado válido.
        if (error && error.code !== "PGRST116") {
            console.error("Erro ao buscar perfil:", error.message);
        }
        return data;
    } catch (err) {
        console.error("Exceção ao buscar perfil:", err);
        return null;
    }
};

/**
 * Atualiza os dados de um perfil de usuário.
 * @param {string} userId - O ID do usuário.
 * @param {Partial<Profile>} updates - Um objeto com os campos a serem atualizados.
 * @returns {Promise<boolean>} - Retorna true em caso de sucesso.
 */
export const updateProfile = async (
    userId: string,
    updates: Partial<Profile>,
): Promise<boolean> => {
    if (!userId) return false;
    try {
        const { error } = await supabase
            .from("profiles")
            .update({ ...updates, updated_at: new Date().toISOString() }) // Sempre atualiza a data de modificação
            .eq("id", userId);

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
 * --- VERSÃO OTIMIZADA ---
 * Faz o upload de um avatar para o Supabase Storage, definindo uma política de cache
 * de longa duração para melhorar a performance de carregamento no cliente.
 * @param {string} userId - O ID do usuário para associar ao arquivo.
 * @param {File | Blob} file - O arquivo de imagem a ser enviado.
 * @returns {Promise<string | null>} - A URL pública do avatar ou null em caso de erro.
 */
export const uploadAvatar = async (
    userId: string,
    file: File | Blob,
): Promise<string | null> => {
    if (!userId || !file) {
        console.error("ID do usuário ou arquivo não fornecido para upload.");
        return null;
    }

    try {
        const fileExt = file.type.split("/")[1] || "jpeg";
        const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        const bucketName = "profiles";

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, {
                // Otimização: Define o cache para 1 ano no navegador e na CDN.
                // Isso evita que o avatar seja baixado repetidamente em cada visita.
                cacheControl: "31536000",
                upsert: false, // Use 'true' se quiser substituir um arquivo com o mesmo nome.
            });

        if (uploadError) {
            console.error(
                "[uploadAvatar] ERRO DO SUPABASE DURANTE O UPLOAD:",
                uploadError,
            );
            throw uploadError;
        }

        const { data } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error(
            "[uploadAvatar] Exceção final no processo de upload do avatar:",
            error,
        );
        return null;
    }
};

/**
 * --- VERSÃO ROBUSTA ---
 * Verifica e atualiza o streak usando comparação de strings de data (AAAA-MM-DD),
 * o que é imune a problemas de fuso horário e garante a atualização apenas uma vez por dia.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<boolean>} - Retorna `true` se o streak foi modificado, `false` caso contrário.
 */
export const updateUserStreak = async (userId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("last_login, streak_days")
            .eq("id", userId)
            .single();

        if (profileError) {
            console.error(
                "Streak: Não foi possível buscar o perfil.",
                profileError.message,
            );
            return false;
        }

        const todayStr = new Date().toISOString().split("T")[0];

        if (!profile.last_login) {
            console.log(
                "Streak: Primeiro login detectado. Iniciando streak em 1.",
            );
            const { error } = await supabase
                .from("profiles")
                .update({
                    streak_days: 1,
                    last_login: new Date().toISOString(),
                })
                .eq("id", userId);

            if (error) {
                console.error(
                    "Streak: Erro ao iniciar o primeiro streak.",
                    error.message,
                );
                return false;
            }
            return true;
        }

        const lastLoginStr = profile.last_login.split("T")[0];

        if (todayStr === lastLoginStr) {
            console.log(
                `Streak: Login já registrado hoje (${todayStr}). Nenhuma ação necessária.`,
            );
            return false;
        }

        const today = new Date(todayStr);
        const lastLoginDate = new Date(lastLoginStr);

        const diffTime = today.getTime() - lastLoginDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let newStreak: number;
        if (diffDays === 1) {
            newStreak = (profile.streak_days || 0) + 1;
            console.log(`Streak: Continuando para ${newStreak} dias.`);
        } else {
            newStreak = 1;
            console.log(
                `Streak: Quebrado (${diffDays} dias de diferença). Resetando para 1.`,
            );
        }

        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                streak_days: newStreak,
                last_login: new Date().toISOString(),
            })
            .eq("id", userId);

        if (updateError) {
            console.error(
                "Streak: Erro ao salvar o novo streak no banco:",
                updateError.message,
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error("Exceção inesperada na função updateUserStreak:", error);
        return false;
    }
};
