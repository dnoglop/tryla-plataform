
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, updateProfile, Profile, uploadAvatar } from "@/services/profileService";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    linkedin_url: "",
    phone: "",
    email: "",
    birthday: "",
    country: "Brasil"
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
          const { data: userData } = await supabase.auth.getUser();
          
          if (userProfile) {
            setProfile(userProfile);
            setFormData({
              full_name: userProfile.full_name || "",
              username: userProfile.username || "",
              bio: userProfile.bio || "",
              avatar_url: userProfile.avatar_url || "",
              linkedin_url: userProfile.linkedin_url || "",
              phone: userProfile.phone || "",
              email: userData?.user?.email || "",
              birthday: userProfile.birthday || "",
              country: userProfile.country || "Brasil"
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
        
        toast.success("Foto de perfil atualizada!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao enviar foto de perfil");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const updatedProfile: Profile = {
        ...profile,
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        linkedin_url: formData.linkedin_url,
        avatar_url: formData.avatar_url,
        phone: formData.phone,
        birthday: formData.birthday,
        country: formData.country
      };
      
      const success = await updateProfile(updatedProfile);
      
      if (success) {
        toast.success("Perfil atualizado com sucesso");
        navigate('/perfil');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Falha ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E36322] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header title="Editar Perfil" />

      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <div className="flex flex-col items-center mb-6">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <div 
            className="w-24 h-24 rounded-full border-2 border-[#E36322] overflow-hidden cursor-pointer mb-2"
            onClick={handleAvatarClick}
          >
            {formData.avatar_url ? (
              <img 
                src={formData.avatar_url} 
                alt="Foto de perfil" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-3xl">
                👤
              </div>
            )}
          </div>
          <p className="text-sm text-[#E36322]">Alterar foto</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              placeholder="Seu nome completo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome de usuário
            </label>
            <Input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              placeholder="@seu_username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              placeholder="+55 (00) 00000-0000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              name="email"
              value={formData.email}
              readOnly
              className="border-gray-300 bg-gray-50"
              placeholder="exemplo@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Nascimento
            </label>
            <div className="relative">
              <Input
                name="birthday"
                type="date"
                value={formData.birthday}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País
            </label>
            <Input
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              placeholder="Seu país"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn URL
            </label>
            <Input
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322]"
              placeholder="https://linkedin.com/in/seu-perfil"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sobre mim
            </label>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="border-gray-300 focus:border-[#E36322] focus:ring-[#E36322] min-h-[100px]"
              placeholder="Conte um pouco sobre você..."
            />
          </div>
        </div>
        
        <div className="pt-6">
          <Button 
            type="submit" 
            className="w-full bg-[#E36322] hover:bg-[#E36322]/90 text-white" 
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
