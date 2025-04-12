
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import UserLevel from "@/components/UserLevel";
import BadgeItem from "@/components/BadgeItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile, Profile } from "@/services/profileService";
import { toast } from "sonner";

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    linkedin_url: ""
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const session = await supabase.auth.getSession();
        
        if (session?.data?.session?.user?.id) {
          const userId = session.data.session.user.id;
          const userProfile = await getProfile(userId);
          
          if (userProfile) {
            setProfile(userProfile);
            setFormData({
              full_name: userProfile.full_name || "",
              username: userProfile.username || "",
              bio: userProfile.bio || "",
              avatar_url: userProfile.avatar_url || "",
              linkedin_url: userProfile.linkedin_url || ""
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Não foi possível carregar seu perfil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      const updatedProfile: Profile = {
        ...profile,
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url
      };
      
      const success = await updateProfile(updatedProfile);
      
      if (success) {
        setProfile(updatedProfile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Falha ao atualizar perfil");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect will be handled by auth listeners in App.tsx
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Falha ao sair da conta");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title="Perfil" showBackButton={false} />

      <div className="container px-4 py-6">
        <div className="mb-6 text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-gray-300 overflow-hidden">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">
                👤
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold">{profile?.full_name || "Usuário"}</h2>
          <p className="text-gray-600 text-sm">@{profile?.username || "username"}</p>
          
          {profile?.level !== undefined && profile?.xp !== undefined && (
            <UserLevel level={profile.level} xp={profile.xp} />
          )}
          
          {!isEditing && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </Button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
              />
            </div>
            
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nome de usuário
              </label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Seu username"
              />
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Biografia
              </label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre você"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url || ""}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        ) : (
          <>
            {profile?.bio && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Sobre mim</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}
            
            {/* Achievements section */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Conquistas</h3>
              <div className="grid grid-cols-3 gap-3">
                <BadgeItem 
                  name="Iniciante" 
                  description="Completou a primeira fase" 
                  isUnlocked={true} 
                />
                <BadgeItem 
                  name="Consistente" 
                  description="Acessou o app por 5 dias seguidos" 
                  isUnlocked={false} 
                />
                <BadgeItem 
                  name="Social" 
                  description="Compartilhou progresso" 
                  isUnlocked={false} 
                />
              </div>
            </div>
            
            {/* Settings and logout */}
            <div className="border-t pt-4">
              <Button variant="outline" className="w-full justify-start text-red-500" onClick={handleSignOut}>
                Sair da conta
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
