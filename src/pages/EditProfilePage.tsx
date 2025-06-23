// ARQUIVO: src/pages/EditProfilePage.tsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, uploadAvatar } from "@/services/profileService";
import { toast } from "sonner";

import { ArrowLeft, User, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const EditProfileSkeleton = () => (
  // O Skeleton que você forneceu está ótimo, mantido aqui.
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
        <Skeleton className="h-24 w-full rounded-xl bg-muted" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl bg-muted mt-8" />
    </main>
  </div>
);

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "", // Adicionado para consistência
    linkedin_url: "",
    bio: "",
    avatar_url: "",
    email: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        setUserId(user.id);
        const profile = await getProfile(user.id);
        if (profile) {
          setFormData({
            full_name: profile.full_name || "",
            birth_date: profile.birth_date || "",
            linkedin_url: profile.linkedin_url || "",
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || "",
            email: user.email || "",
          });
        } else {
          setFormData(prev => ({ ...prev, email: user.email || "" }));
        }
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    };
    fetchUserProfile();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !userId) return;
    try {
      toast.info("Enviando nova foto...");
      const imageUrl = await uploadAvatar(userId, e.target.files[0]);
      if (imageUrl) {
        setFormData(prev => ({ ...prev, avatar_url: imageUrl }));
        toast.success("Foto de perfil atualizada!");
      }
    } catch (error) { toast.error("Falha ao enviar a foto."); }
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
      } else { throw new Error("A atualização falhou."); }
    } catch (error) { toast.error("Falha ao salvar. Tente novamente."); } 
    finally { setIsSaving(false); }
  };

  if (isLoading) return <EditProfileSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Editar Perfil</h1>
      </header>

      <main className="px-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto mt-6">
          <div className="flex flex-col items-center gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange}/>
            <Avatar className="h-24 w-24 border-4 border-card shadow-lg cursor-pointer ring-2 ring-primary/30" onClick={() => fileInputRef.current?.click()}>
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                {formData.full_name?.[0]?.toUpperCase() || <User />}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="link" onClick={() => fileInputRef.current?.click()}>
              <Camera className="w-4 h-4 mr-1.5"/> Alterar foto
            </Button>
          </div>

          <div className="space-y-6 bg-card p-6 rounded-2xl shadow-sm border">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold mb-1.5">Nome Completo *</label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
            </div>
            <div>
              <label htmlFor="birth_date" className="block text-sm font-semibold mb-1.5">Data de Nascimento</label>
              <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-semibold mb-1.5">LinkedIn</label>
              <Input id="linkedin_url" name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleInputChange} />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold mb-1.5">Sobre mim</label>
              <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={4} />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default EditProfilePage;