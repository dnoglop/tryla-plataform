// src/pages/CompleteProfilePage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { updateProfile, uploadAvatar, getProfile } from "@/services/profileService";
import { generateUsername } from "@/lib/utils";
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
        // Redirecionamento de segurança, embora o ProtectedRoute já deva impedir isso
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'full_name' && value && !formData.username) {
      const generatedUsername = generateUsername(value);
      setFormData(prev => ({ ...prev, username: generatedUsername }));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;
    const file = e.target.files[0];
    
    try {
      toast.info("Enviando imagem...");
      const imageUrl = await uploadAvatar(userId, file);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
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
      const success = await updateProfile(userId, formData);
      if (success) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trilha-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
        <button
          onClick={() => navigate('/onboarding')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 transition-all hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
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
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Complete seu Perfil</h1>
          <p className="text-slate-600">Conte-nos mais sobre você para personalizar sua experiência</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
             {/* ... seu formulário JSX completo aqui ... */}
             <div className="flex flex-col items-center mb-6">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              <div className="w-24 h-24 rounded-full border-2 border-trilha-orange overflow-hidden cursor-pointer bg-orange-100 flex items-center justify-center hover:border-orange-500/80 transition-all duration-300" onClick={handleAvatarClick}>
                {formData.avatar_url ? <img src={formData.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" /> : <Camera className="h-8 w-8 text-trilha-orange" />}
              </div>
              <p className="text-sm text-trilha-orange mt-3 font-medium">Adicionar foto de perfil</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><User className="inline h-4 w-4 mr-2" />Nome completo *</label>
              <Input name="full_name" value={formData.full_name} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange focus:ring-trilha-orange/20 rounded-xl h-12" placeholder="Seu nome completo" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><AtSign className="inline h-4 w-4 mr-2" />Nome de usuário *</label>
              <Input name="username" value={formData.username} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange focus:ring-trilha-orange/20 rounded-xl h-12" placeholder="@seu_username" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><Linkedin className="inline h-4 w-4 mr-2" />LinkedIn (opcional)</label>
              <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange focus:ring-trilha-orange/20 rounded-xl h-12" placeholder="https://linkedin.com/in/seu-perfil" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"><FileText className="inline h-4 w-4 mr-2" />Sobre mim (opcional)</label>
              <Textarea name="bio" value={formData.bio} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange focus:ring-trilha-orange/20 min-h-[100px] rounded-xl resize-none" placeholder="Conte um pouco sobre você, seus sonhos e objetivos..." />
            </div>
            <Button type="submit" className="w-full bg-trilha-orange hover:bg-trilha-orange/90 text-white font-semibold py-4 text-lg rounded-xl shadow-sm transition-all duration-300 hover:shadow-md" disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Finalizar Cadastro"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;