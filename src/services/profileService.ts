
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  linkedin_url: string | null;
}

export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    return data as Profile;
  } catch (error) {
    console.error("Error in getCurrentProfile:", error);
    return null;
  }
};

export const updateProfile = async (profile: Partial<Profile>): Promise<boolean> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user) {
      toast.error("Usuário não autenticado");
      return false;
    }
    
    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", session.session.user.id);
    
    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil: " + error.message);
      return false;
    }
    
    toast.success("Perfil atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error("Error in updateProfile:", error);
    toast.error("Erro ao atualizar perfil");
    return false;
  }
};

export const uploadAvatar = async (file: File): Promise<string | null> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session.session?.user) {
      toast.error("Usuário não autenticado");
      return null;
    }
    
    const userId = session.session.user.id;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Fazer upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    
    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      toast.error("Erro ao fazer upload da imagem");
      return null;
    }
    
    // Obter a URL pública da imagem
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);
    
    // Atualizar o perfil com a nova URL do avatar
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error updating profile with avatar:", updateError);
      toast.error("Erro ao atualizar foto de perfil");
      return null;
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    toast.error("Erro ao fazer upload da imagem");
    return null;
  }
};
