
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

export default {
  getProfile,
  updateProfile,
  uploadAvatar
};
