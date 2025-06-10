
// src/services/profileService.ts

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    if (error && error.code !== 'PGRST116') console.error("Erro ao buscar perfil:", error.message);
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

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  if (!userId) {
    console.error("ID do usuário é necessário para o upload do avatar.");
    return null;
  }
  
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
      });

    if (uploadError) {
      console.error("Erro no upload do Supabase Storage:", uploadError.message);
      throw uploadError;
    }

    // Pega a URL pública do arquivo
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
        console.error("A função getPublicUrl retornou uma URL vazia.");
        throw new Error("Não foi possível obter a URL pública do avatar.");
    }
    
    // Constrói a URL final com o "cache buster"
    const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

    console.log("URL final gerada para o avatar:", finalUrl);
      
    return finalUrl;
    
  } catch (error) {
    console.error('Exceção na função uploadAvatar:', error);
    toast.error("Falha ao processar a imagem do perfil.");
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
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastLogin = profile.last_login;
    if (lastLogin === today) return;
    let newStreak = (lastLogin === yesterday) ? (profile.streak_days || 0) + 1 : 1;
    const { error: updateError } = await supabase.from('profiles').update({ streak_days: newStreak, last_login: today }).eq('id', userId);
    if (updateError) console.error("Erro ao salvar o novo streak no banco:", updateError.message);
  } catch (error) {
    console.error("Exceção inesperada na função updateUserStreak:", error);
  }
};
