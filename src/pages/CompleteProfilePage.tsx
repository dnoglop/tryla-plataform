
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile, uploadAvatar, generateUsername, getProfile } from "@/services/profileService";
import { completeOnboarding } from "@/services/onboardingService";
import { toast } from "sonner";
import { Camera, User, AtSign, FileText, Linkedin, ArrowLeft } from "lucide-react";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    linkedin_url: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Carregar dados existentes do perfil
        const existingProfile = await getProfile(user.id);
        if (existingProfile) {
          setFormData({
            full_name: existingProfile.full_name || "",
            username: existingProfile.username || "",
            bio: existingProfile.bio || "",
            avatar_url: existingProfile.avatar_url || "",
            linkedin_url: existingProfile.linkedin_url || "",
          });
        }
        setIsLoadingProfile(false);
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate username when full name changes and username is empty
    if (name === 'full_name' && value && !formData.username) {
      const generatedUsername = generateUsername(value);
      setFormData(prev => ({
        ...prev,
        username: generatedUsername
      }));
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;
    
    const file = e.target.files[0];
    
    try {
      toast.info("Enviando imagem...");
      
      const imageUrl = await uploadAvatar(userId, file);
      
      if (imageUrl) {
        setFormData(prev => ({
          ...prev,
          avatar_url: imageUrl
        }));
        
        toast.success("Foto de perfil adicionada!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao enviar foto de perfil");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !formData.full_name || !formData.username) {
      toast.error("Por favor, preencha pelo menos o nome e usuário");
      return;
    }
    
    setIsLoading(true);
    try {
      // Atualizar perfil
      const success = await updateProfile(userId, formData);
      
      if (success) {
        // Marcar onboarding como completo
        await completeOnboarding(userId);
        
        toast.success("Perfil criado com sucesso! Bem-vindo(a) à Tryla!");
        navigate('/dashboard');
      } else {
        toast.error("Erro ao criar perfil. Tente novamente.");
      }
    } catch (error) {
      console.error("Error completing profile:", error);
      toast.error("Erro ao criar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-trilha-orange-light to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-trilha-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-trilha-orange-light to-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <button
          onClick={() => navigate('/onboarding')}
          className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-trilha-orange" />
        </button>
        <div className="w-16 h-16 flex items-center justify-center">
          <img 
            src="https://i.imgur.com/TmfqRTD.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-trilha-orange mb-3">Complete seu Perfil</h1>
          <p className="text-gray-600 text-lg">Conte-nos mais sobre você para personalizar sua experiência</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-6">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div 
                className="w-28 h-28 rounded-full border-4 border-trilha-orange overflow-hidden cursor-pointer bg-trilha-orange-light flex items-center justify-center hover:border-trilha-orange/80 transition-all duration-300 hover:scale-105"
                onClick={handleAvatarClick}
              >
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-10 w-10 text-trilha-orange" />
                )}
              </div>
              <p className="text-sm text-trilha-orange mt-3 font-medium">Adicionar foto de perfil</p>
            </div>

            {/* Nome completo */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <User className="inline h-4 w-4 mr-2" />
                Nome completo *
              </label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="border-2 border-gray-200 focus:border-trilha-orange focus:ring-trilha-orange rounded-xl h-12 text-base"
                placeholder="Seu nome completo"
                required
              />
            </div>
            
            {/* Nome de usuário */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <AtSign className="inline h-4 w-4 mr-2" />
                Nome de usuário *
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="border-2 border-gray-200 focus:border-trilha-orange focus:ring-trilha-orange rounded-xl h-12 text-base"
                placeholder="@seu_username"
                required
              />
            </div>
            
            {/* LinkedIn URL */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Linkedin className="inline h-4 w-4 mr-2" />
                LinkedIn (opcional)
              </label>
              <Input
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                className="border-2 border-gray-200 focus:border-trilha-orange focus:ring-trilha-orange rounded-xl h-12 text-base"
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
            
            {/* Sobre mim */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FileText className="inline h-4 w-4 mr-2" />
                Sobre mim (opcional)
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="border-2 border-gray-200 focus:border-trilha-orange focus:ring-trilha-orange min-h-[100px] rounded-xl text-base resize-none"
                placeholder="Conte um pouco sobre você, seus sonhos e objetivos..."
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-trilha-orange hover:bg-trilha-orange/90 text-white font-bold py-4 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? "Criando perfil..." : "Finalizar Cadastro"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
