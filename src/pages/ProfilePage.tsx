
import React, { useState, useEffect, useRef } from "react";
import { Mail, Linkedin, Users, Target, Rocket, Book, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile, Profile, uploadAvatar } from "@/services/profileService";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    
    if (!profile) return;
    
    try {
      toast.info("Enviando imagem...");
      
      const imageUrl = await uploadAvatar(profile.id, file);
      
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          avatar_url: imageUrl
        }));
        
        const success = await updateProfile({
          ...profile,
          avatar_url: imageUrl
        });
        
        if (success) {
          setProfile({
            ...profile,
            avatar_url: imageUrl
          });
          toast.success("Foto de perfil atualizada!");
        }
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao enviar foto de perfil");
    }
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

  const level = profile?.level || 1;
  const nextLevel = level + 1;
  const currentXp = profile?.xp || 0;
  const maxXp = level * 100;
  const xpProgress = (currentXp / maxXp) * 100;
  const streakDays = profile?.streak_days || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title="Seu Perfil" />

      <div className="bg-gradient-to-r from-orange-400 to-amber-400 pt-6 pb-8 px-4">
        <div className="relative flex items-start">
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <div 
              className="w-24 h-24 rounded-full border-4 border-white overflow-hidden cursor-pointer"
              onClick={handleAvatarClick}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl">
                  👤
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-4 flex-1">
            <h2 className="text-2xl font-bold text-white">{profile?.full_name || "Usuário"}</h2>
            <p className="text-white/90">@{profile?.username || "username"}</p>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="absolute right-0 top-2 rounded-full bg-white/20 hover:bg-white/30 border-none text-white"
              onClick={() => setIsEditing(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-white">
          <div className="mb-1 flex justify-between text-sm">
            <span>{currentXp}/{maxXp} XP</span>
            <span>Nível {nextLevel}</span>
          </div>
          <div className="relative h-3 w-full bg-white/30 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-white rounded-full" 
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span>Nível {level}</span>
            <span>{streakDays} {streakDays === 1 ? 'dia' : 'dias'} de sequência</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-bold text-xl mb-4">Sobre mim</h3>
          {!isEditing ? (
            <>
              <p className="text-gray-700 mb-4">{profile?.bio || "Adicione uma biografia para se apresentar."}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={18} />
                  <span>Na Trilha desde Dez 2024</span>
                </div>
                
                {profile?.linkedin_url && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Linkedin size={18} />
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-trilha-orange">
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              </div>
            </>
          ) : (
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
          )}
        </div>
        
        {/* Link para o Diário de Aprendizado */}
        <Link to="/diario" className="bg-white rounded-lg shadow-sm p-6 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <h3 className="font-bold text-lg">Diário de Aprendizado</h3>
              <p className="text-sm text-gray-600">Registre insights e reflexões da sua jornada</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </Link>
        
        {/* Emblemas section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-bold text-xl mb-4">Meus Emblemas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-2">
                <Rocket className="text-orange-500" />
              </div>
              <p className="text-sm font-medium">Primeiro Passo</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <Users className="text-gray-500" />
              </div>
              <p className="text-sm font-medium">Explorador(a) Social</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2">
                <Target className="text-red-500" />
              </div>
              <p className="text-sm font-medium">Fera nos Quizzes</p>
            </div>
          </div>
        </div>
        
        {/* Conquistas section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="font-bold text-xl mb-4">Conquistas</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Módulos Completos</span>
                <span className="text-sm font-medium text-orange-500">1/5</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-trilha-orange rounded-full" style={{ width: '20%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Fases Completas</span>
                <span className="text-sm font-medium text-orange-500">3/20</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-trilha-orange rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Settings and logout */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Button variant="outline" className="w-full justify-start text-red-500" onClick={handleSignOut}>
            Sair da conta
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ProfilePage;
