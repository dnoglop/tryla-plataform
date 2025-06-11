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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSaveCroppedImage = async () => {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-trilha-orange" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={!!imageSrc} onOpenChange={(isOpen) => !isOpen && setImageSrc(null)}>
        {/* <<< MUDANÇA DE ESTILO >>> Adicionamos classes para o fundo branco, padding, sombra, etc. */}
        <DialogContent className="bg-white p-6 rounded-2xl shadow-xl border-slate-200/50 sm:max-w-md">
          <DialogHeader>
            {/* <<< MUDANÇA DE ESTILO >>> Estilizando o título */}
            <DialogTitle className="text-xl font-bold text-slate-900 text-center">
              Edite sua foto de perfil
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-64 mx-auto my-4 bg-slate-100 rounded-full overflow-hidden">
            <Cropper
              image={imageSrc || ''}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="space-y-2 pt-2">
            <label htmlFor="zoom-slider" className="text-sm font-medium text-slate-700">Zoom</label>
            <Slider
              id="zoom-slider"
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>
          {/* <<< MUDANÇA DE ESTILO >>> Estilizando os botões */}
          <DialogFooter className="sm:justify-center gap-2 pt-4">
            <Button variant="outline" className="h-11 border-slate-300" onClick={() => setImageSrc(null)} disabled={isCropping}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCroppedImage} 
              disabled={isCropping}
              className="h-11 bg-trilha-orange hover:bg-trilha-orange/90 text-white font-semibold"
            >
              {isCropping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Olá {formData.full_name.split(' ')[0]}, complete o seu perfil! </h1>
                <p className="text-slate-600"> Complete as suas informações para viver uma experiência completa!</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center mb-6">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        <div className="w-24 h-24 rounded-full border-2 border-trilha-orange overflow-hidden cursor-pointer bg-orange-100 flex items-center justify-center hover:border-orange-500/80 transition-all duration-300" onClick={handleAvatarClick}>
                            {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="h-8 w-8 text-trilha-orange" />
                            )}
                        </div>
                        <p className="text-sm text-trilha-orange mt-3 font-medium">Adicionar sua foto de perfil</p>
                    </div>
                
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2"><AtSign className="inline h-4 w-4 mr-2" />Nome de usuário *</label>
                        <Input name="username" value={formData.username} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange text-gray-500 focus:ring-trilha-orange/20 rounded-xl h-12" placeholder="@seu_username" required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2"><Linkedin className="inline h-4 w-4 mr-2" />LinkedIn (opcional)</label>
                        <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange text-gray-500 focus:ring-trilha-orange/20 rounded-xl text-gray-500 h-12" placeholder="https://linkedin.com/in/seu-perfil" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2"><FileText className="inline h-4 w-4 mr-2" />Sobre mim (opcional)</label>
                        <Textarea name="bio" value={formData.bio} onChange={handleInputChange} className="border-slate-200 focus:border-trilha-orange text-italic focus:ring-trilha-orange/20 min-h-[100px] text-gray-500 rounded-xl resize-none" placeholder="Conte um pouco sobre você para as pessoas da comunidade" />
                    </div>
                    <Button type="submit" className="w-full bg-trilha-orange hover:bg-trilha-orange/90 text-white font-semibold py-4 text-lg rounded-xl shadow-sm transition-all duration-300 hover:shadow-md" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : "Finalizar Cadastro"}
                    </Button>
                </form>
            </div>
        </div>
      </div>
    </>
  );
};

export default CompleteProfilePage;