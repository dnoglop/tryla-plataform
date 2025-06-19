
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, Profile, uploadAvatar } from "@/services/profileService";
import { toast } from "sonner";

import { ArrowLeft, User, Linkedin, FileText, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const EditProfileSkeleton = () => (
  <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 animate-pulse">
    <header className="flex items-center gap-4 mb-8">
      <Skeleton className="h-10 w-10 rounded-full bg-muted" />
      <Skeleton className="h-7 w-40 rounded-md bg-muted" />
    </header>
    <main className="space-y-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full bg-muted mb-2" />
        <Skeleton className="h-5 w-24 rounded-md bg-muted" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-xl bg-muted" />
        <Skeleton className="h-12 w-full rounded-xl bg-muted" />
        <Skeleton className="h-12 w-full rounded-xl bg-muted" />
        <Skeleton className="h-24 w-full rounded-xl bg-muted" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl bg-muted mt-8" />
    </main>
  </div>
);

const EditProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    linkedin_url: "",
    email: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        toast.error("Erro ao obter sessão. Tente recarregar.");
        console.error("Erro na sessão:", sessionError.message);
        setIsLoading(false);
        navigate('/login');
        return;
      }
      
      if (session?.user?.id) {
        const currentUserId = session.user.id;
        setUserId(currentUserId);

        const userProfile = await getProfile(currentUserId);
        if (userProfile) {
          setFormData({
            full_name: userProfile.full_name || "",
            username: userProfile.username || "",
            bio: userProfile.bio || "",
            avatar_url: userProfile.avatar_url || "",
            linkedin_url: userProfile.linkedin_url || "",
            email: session.user.email || "",
          });
        } else {
          setFormData(prev => ({ ...prev, email: session.user.email || "" }));
          toast.info("Complete seu perfil.");
        }
      } else {
        toast.error("Sessão não encontrada. Faça login novamente.");
        navigate('/login');
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !userId) return;
    
    const file = e.target.files[0];
    
    try {
      toast.info("Enviando nova foto...");
      const imageUrl = await uploadAvatar(userId, file);
      
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
        toast.success("Foto de perfil atualizada!");
      }
    } catch (error) {
      console.error("Erro no upload do avatar (componente):", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSaving(true);
    try {
        const { email, ...profileUpdates } = formData;
        const success = await updateProfile(userId, profileUpdates);
        
        if (success) {
            await queryClient.invalidateQueries({ queryKey: ['profilePageData', userId] });
            
            toast.success("Perfil atualizado com sucesso!");
            navigate('/perfil');
        } else {
            throw new Error("A atualização do perfil falhou no servidor.");
        }
    } catch (error: any) {
        console.error("Erro ao atualizar perfil:", error.message);
        toast.error("Falha ao salvar as alterações. Tente novamente.");
    } finally {
        setIsSaving(false);
    }
};

  if (isLoading) {
    return <EditProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 sm:p-6 lg:p-8 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-card shadow-sm border border-border" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Editar Perfil</h1>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 pb-24">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto mt-6">
          <div className="flex flex-col items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarChange}
            />
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg cursor-pointer ring-2 ring-primary/30" onClick={handleAvatarClick}>
              <AvatarImage src={formData.avatar_url} alt="Seu avatar" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="link" className="text-sm text-primary font-semibold hover:text-primary/80" onClick={handleAvatarClick}>
              <Camera className="w-4 h-4 mr-1.5"/>
              Alterar foto de perfil
            </Button>
          </div>

          <div className="space-y-6 bg-card p-6 rounded-2xl shadow-sm border">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-foreground mb-1.5">Nome Completo *</label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Seu nome completo" className="h-12 rounded-xl" required />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-foreground mb-1.5">Nome de Usuário *</label>
              <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="@seu_username" className="h-12 rounded-xl" required />
            </div>

            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-semibold text-foreground mb-1.5">LinkedIn (opcional)</label>
              <Input id="linkedin_url" name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/seu-perfil" className="h-12 rounded-xl" />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">E-mail (não editável)</label>
              <Input id="email" name="email" value={formData.email} readOnly className="h-12 rounded-xl bg-muted text-muted-foreground cursor-not-allowed" />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-foreground mb-1.5">Sobre mim (opcional)</label>
              <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Conte um pouco sobre você..." className="min-h-[120px] rounded-xl resize-none" rows={4} />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 h-12 text-base rounded-xl shadow-md hover:shadow-lg transition-shadow" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default EditProfilePage;
