
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile, uploadAvatar, generateUsername } from "@/services/profileService";
import { completeOnboarding } from "@/services/onboardingService";
import { toast } from "sonner";
import { Camera, User, AtSign, FileText, Linkedin } from "lucide-react";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

    // Auto-generate username when full name changes
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="https://i.imgur.com/TmfqRTD.gif" 
              alt="Logo Tryla" 
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete seu Perfil</h1>
          <p className="text-gray-600">Conte-nos mais sobre você para personalizar sua experiência</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
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
                className="w-24 h-24 rounded-full border-4 border-orange-200 overflow-hidden cursor-pointer bg-orange-50 flex items-center justify-center hover:border-orange-300 transition-colors"
                onClick={handleAvatarClick}
              >
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-orange-400" />
                )}
              </div>
              <p className="text-sm text-orange-600 mt-2">Adicionar foto de perfil</p>
            </div>

            {/* Nome completo */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nome completo *
              </label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                placeholder="Seu nome completo"
                required
              />
            </div>
            
            {/* Nome de usuário */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AtSign className="inline h-4 w-4 mr-1" />
                Nome de usuário *
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                placeholder="@seu_username"
                required
              />
            </div>
            
            {/* LinkedIn URL */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Linkedin className="inline h-4 w-4 mr-1" />
                LinkedIn (opcional)
              </label>
              <Input
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                placeholder="https://linkedin.com/in/seu-perfil"
              />
            </div>
            
            {/* Sobre mim */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Sobre mim (opcional)
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[80px]"
                placeholder="Conte um pouco sobre você, seus sonhos e objetivos..."
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105" 
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
