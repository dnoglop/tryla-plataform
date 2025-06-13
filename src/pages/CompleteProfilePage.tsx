import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Cropper, { Area } from 'react-easy-crop';

// Componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

// Serviços e Utilitários
import { supabase } from "@/integrations/supabase/client";
import { updateProfile, uploadAvatar, getProfile } from "@/services/profileService";
import { generateUsername } from "@/lib/utils";
import { getCroppedImg } from "@/lib/cropImage";
import { completeOnboarding } from "@/services/onboardingService";
import { toast } from "sonner";
import { Camera, User, AtSign, FileText, Linkedin, ArrowLeft, Loader2 } from "lucide-react";

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  // Estados para o Editor de Imagem
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const existingProfile = await getProfile(user.id);
        const initialFullName = existingProfile?.full_name || user.user_metadata?.full_name || "";
        setFormData({
          full_name: initialFullName,
          username: existingProfile?.username || generateUsername(initialFullName),
          bio: existingProfile?.bio || "",
          avatar_url: existingProfile?.avatar_url || "",
          linkedin_url: existingProfile?.linkedin_url || "",
        });
        setIsLoadingProfile(false);
      } else {
        navigate("/login");
      }
    };
    getUser();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !userId) return;

    setIsCropping(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error('Não foi possível cortar a imagem.');

      toast.info("Enviando nova foto...");
      const imageUrl = await uploadAvatar(userId, croppedImageBlob);
      
      if (imageUrl) {

        const finalUrl = `${imageUrl}?t=${new Date().getTime()}`;
        setFormData((prev) => ({ ...prev, avatar_url: imageUrl }));
        toast.success("Foto de perfil atualizada!");
      }
    } catch (error) {
      console.error("Erro ao cortar e enviar avatar:", error);
      toast.error("Erro ao salvar nova foto.");
    } finally {
      setIsCropping(false);
      setImageSrc(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !formData.full_name || !formData.username) {
      toast.error("Por favor, preencha pelo menos o nome e o usuário");
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateProfile(userId, formData);
      if (success) {
        await completeOnboarding(userId);
        await queryClient.invalidateQueries({ queryKey: ["userAuthStatus"] });
        toast.success(`Perfil finalizado! Bem-vindo(a) à Tryla, ${formData.full_name.split(' ')[0]}! 🎉`);
        navigate("/dashboard");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-card shadow-sm border border-border"
            onClick={() => navigate("/onboarding")}
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Complete seu perfil</h1>
        </header>

        <div className="bg-card rounded-2xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col items-center gap-4 mb-8">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
            <div
              className="relative w-24 h-24 rounded-full bg-muted border-4 border-card shadow-lg cursor-pointer ring-2 ring-primary/30 flex items-center justify-center overflow-hidden"
              onClick={handleAvatarClick}
            >
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Seu avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <Button
              type="button"
              variant="link"
              className="text-sm text-primary font-semibold"
              onClick={handleAvatarClick}
            >
              Adicionar foto de perfil
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <User className="w-4 h-4" />
                  Nome Completo *
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Seu nome completo"
                  className="h-12 rounded-xl bg-background border-border"
                  required
                />
              </div>

              <div>
                <label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <AtSign className="w-4 h-4" />
                  Nome de Usuário *
                </label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="@seu_username"
                  className="h-12 rounded-xl bg-background border-border"
                  required
                />
              </div>

              <div>
                <label htmlFor="linkedin_url" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn (opcional)
                </label>
                <Input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/seu-perfil"
                  className="h-12 rounded-xl bg-background border-border"
                />
              </div>

              <div>
                <label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Sobre mim (opcional)
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Conte um pouco sobre você..."
                  className="min-h-[120px] rounded-xl resize-none bg-background border-border"
                  rows={4}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 h-12 text-base rounded-xl shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando perfil...
                </>
              ) : (
                "Finalizar perfil"
              )}
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajustar foto do perfil</DialogTitle>
          </DialogHeader>
          {imageSrc && (
            <div className="space-y-4">
              <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Zoom:</label>
                <Slider
                  value={[zoom]}
                  onValueChange={(values) => setZoom(values[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCropping(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCropSave} className="bg-primary hover:bg-primary/90">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompleteProfilePage;
