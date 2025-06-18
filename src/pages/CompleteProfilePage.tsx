import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import Cropper, { Area } from 'react-easy-crop';
import ReactMarkdown from 'react-markdown';

// Componentes UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Serviços e Utilitários
import { supabase } from "@/integrations/supabase/client";
import { updateProfile, uploadAvatar, getProfile } from "@/services/profileService";
import { getCroppedImg } from "@/lib/cropImage";
import { toast } from "sonner";
import { generatePersonalizedTrack, saveUserTrack } from "@/services/trackService";

// Ícones
import { Camera, User, AtSign, FileText, Linkedin, ArrowLeft, Loader2, Sparkles, BrainCircuit, Target, ShieldQuestion, MapPin, Calendar, Heart, ThumbsUp } from "lucide-react";

// Componente principal
const CompleteProfilePage = () => {
  // ==========================================================
  // Hooks
  // ==========================================================
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================================
  // States
  // ==========================================================
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const [formData, setFormData] = useState({
    // Parte 1: Perfil Básico
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    linkedin_url: "",
    // Parte 2: Dados Demográficos
    birth_date: "",
    gender: "",
    city: "",
    state: "",
    // Parte 3: Onboarding IA
    academicGoals: '',
    professionalGoals: '',
    challenges: '',
    hobbies: '',
    // CORREÇÃO: A linha 'full_name: formData.full_name' foi removida daqui.
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiJustification, setAiJustification] = useState("");

  // ==========================================================
  // Funções Handler
  // ==========================================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (value: string) => {
    // CORREÇÃO: Atualizar o campo 'gender' especificamente.
    setFormData(prev => ({ ...prev, gender: value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setIsCropping(true);
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

      toast.promise(uploadAvatar(userId, croppedImageBlob), {
        loading: "Enviando nova foto...",
        success: (imageUrl) => {
          setFormData(prev => ({ ...prev, avatar_url: `${imageUrl}?t=${new Date().getTime()}` }));
          return "Foto de perfil atualizada!";
        },
        error: "Erro ao salvar nova foto.",
      });
    } catch (error) {
      console.error("Erro ao cortar e enviar avatar:", error);
    } finally {
      setIsCropping(false);
      setImageSrc(null);
    }
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    toast.success(`Bem-vindo(a) à Tryla, ${formData.full_name.split(' ')[0]}! 🎉`);
    navigate('/inicio');
  }

  // ==========================================================
  // Mutations e Effects
  // ==========================================================
  const trackMutation = useMutation({
    mutationFn: generatePersonalizedTrack,
    onSuccess: async (trackData) => {
      if (!userId) return;
      await saveUserTrack(userId, trackData, formData);
      await queryClient.invalidateQueries({ queryKey: ['userAuthStatus'] });
      setAiJustification(trackData.justification_text);
      setIsAiModalOpen(true);
    },
    onError: (error) => {
      toast.error("Tivemos um problema ao criar sua trilha. Por favor, tente novamente.");
      console.error("Erro na geração da trilha:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const requiredFields = {
      "Nome Completo": formData.full_name, "Nome de Usuário": formData.username, "Data de Nascimento": formData.birth_date,
      "Metas Acadêmicas": formData.academicGoals, "Metas Profissionais": formData.professionalGoals, "Maiores Desafios": formData.challenges, "Hobbies": formData.hobbies
    };

    for(const [key, value] of Object.entries(requiredFields)) {
        if (!value.trim()) {
            toast.info(`Por favor, preencha o campo "${key}".`);
            return;
        }
    }

    try {
      await updateProfile(userId, {
        full_name: formData.full_name, username: formData.username, bio: formData.bio, avatar_url: formData.avatar_url,
        linkedin_url: formData.linkedin_url, birth_date: formData.birth_date, gender: formData.gender, city: formData.city, state: formData.state,
      });
      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });

      trackMutation.mutate({
        academicGoals: formData.academicGoals, professionalGoals: formData.professionalGoals, challenges: formData.challenges,
        hobbies: formData.hobbies, birth_date: formData.birth_date, gender: formData.gender, city: formData.city, state: formData.state,
        full_name: formData.full_name,
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil básico:", error);
      toast.error("Houve um erro ao salvar seu perfil. Tente novamente.");
    }
  };
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const existingProfile = await getProfile(user.id);
        setFormData(prev => ({
          ...prev,
          full_name: existingProfile?.full_name || user.user_metadata?.full_name || "",
          username: existingProfile?.username || `user${user.id.substring(0, 6)}`,
          bio: existingProfile?.bio || "",
          avatar_url: existingProfile?.avatar_url || "",
          linkedin_url: existingProfile?.linkedin_url || "",
          birth_date: existingProfile?.birth_date || "",
          gender: existingProfile?.gender || "",
          city: existingProfile?.city || "",
          state: existingProfile?.state || "",
        }));
        setIsLoadingProfile(false);
      } else {
        navigate("/login");
      }
    };
    getUser();
  }, [navigate]);

  // ==========================================================
  // Lógica de Renderização
  // ==========================================================
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-card shadow-sm border border-border" onClick={() => navigate(-1)} >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Complete seu perfil</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* SEÇÃO 1: PERFIL BÁSICO E FOTO */}
          <div className="bg-card rounded-2xl shadow-sm border p-6">
            <div className="flex flex-col items-center gap-4 mb-8">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect}/>
              <div className="relative w-24 h-24 rounded-full bg-muted border-4 border-card shadow-lg cursor-pointer ring-2 ring-primary/30 flex items-center justify-center overflow-hidden" onClick={handleAvatarClick}>
                {formData.avatar_url ? ( <img src={formData.avatar_url} alt="Seu avatar" className="w-full h-full object-cover"/>) : (<User className="w-10 h-10 text-muted-foreground" />)}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <Button type="button" variant="link" className="text-sm text-primary font-semibold" onClick={handleAvatarClick}>
                Adicionar foto de perfil
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><User className="w-4 h-4" />Nome Completo *</Label>
                <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Seu nome completo" className="h-12 rounded-xl bg-background border-border" required/>
              </div>
              <div>
                <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><AtSign className="w-4 h-4" />Nome de Usuário *</Label>
                <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="@seu_username" className="h-12 rounded-xl bg-background border-border" required/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="birth_date" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><Calendar className="w-4 h-4" />Data de Nascimento *</Label>
                  <Input id="birth_date" name="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} className="h-12 rounded-xl bg-background border-border" required/>
                </div>
                <div>
                  <Label htmlFor="gender" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><Heart className="w-4 h-4" />Gênero</Label>
                  <Select onValueChange={handleGenderChange} value={formData.gender}>
                    <SelectTrigger className="h-12 rounded-xl bg-background border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent><SelectItem value="Feminino">Feminino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Não-binário">Não-binário</SelectItem><SelectItem value="Outro">Outro</SelectItem><SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><MapPin className="w-4 h-4" />Cidade</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} placeholder="Sua cidade" className="h-12 rounded-xl bg-background border-border" />
                </div>
                <div>
                  <Label htmlFor="state" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><MapPin className="w-4 h-4" />Estado</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} placeholder="Seu estado" className="h-12 rounded-xl bg-background border-border" />
                </div>
              </div>
              <div>
                <Label htmlFor="linkedin_url" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><Linkedin className="w-4 h-4" />LinkedIn (opcional)</Label>
                <Input id="linkedin_url" name="linkedin_url" type="url" value={formData.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/seu-perfil" className="h-12 rounded-xl bg-background border-border"/>
              </div>
              <div>
                <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><FileText className="w-4 h-4" />Sobre mim (opcional)</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Conte um pouco sobre você..." className="min-h-[120px] rounded-xl resize-none bg-background border-border" rows={4}/>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: ONBOARDING DA IA */}
          <div className="bg-card rounded-2xl shadow-sm border p-6">
            <div className="text-center mb-8">
              <Sparkles className="mx-auto h-8 w-8 text-primary mb-2" />
              <h2 className="text-lg font-bold">Personalize sua jornada</h2>
              <p className="text-sm text-muted-foreground">Suas respostas criarão uma trilha única para você!</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label htmlFor="academicGoals" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><Target className="w-4 h-4" />Qual sua principal meta acadêmica hoje? *</Label>
                <Textarea id="academicGoals" name="academicGoals" value={formData.academicGoals} onChange={handleInputChange} placeholder="Ex: Passar no vestibular, me destacar na faculdade, aprender uma nova tecnologia..." required className="min-h-[100px] bg-background"/>
              </div>
              <div>
                <Label htmlFor="professionalGoals" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><BrainCircuit className="w-4 h-4" />E na carreira, qual o seu sonho? *</Label>
                <Textarea id="professionalGoals" name="professionalGoals" value={formData.professionalGoals} onChange={handleInputChange} placeholder="Ex: Conseguir meu primeiro estágio, ser promovido, abrir meu próprio negócio..." required className="min-h-[100px] bg-background"/>
              </div>
              <div>
                <Label htmlFor="challenges" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><ShieldQuestion className="w-4 h-4" />Qual seu maior desafio atualmente? *</Label>
                <Textarea id="challenges" name="challenges" value={formData.challenges} onChange={handleInputChange} placeholder="Ex: Dificuldade em organizar meus estudos, não sei qual carreira seguir, tenho medo de falar em público..." required className="min-h-[100px] bg-background"/>
              </div>
              <div>
                <Label htmlFor="hobbies" className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2"><User className="w-4 h-4" />O que você ama fazer no seu tempo livre? *</Label>
                <Textarea id="hobbies" name="hobbies" value={formData.hobbies} onChange={handleInputChange} placeholder="Ex: Jogar videogames, ler livros de ficção, praticar esportes, desenhar..." required className="min-h-[100px] bg-background"/>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 h-12 text-base rounded-xl shadow-md" disabled={trackMutation.isPending}>
            {trackMutation.isPending ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Criando sua trilha...</>) : ("Finalizar e Criar Minha Trilha")}
          </Button>
        </form>
      </div>

      {/* Modal para cortar a imagem de perfil */}
      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader><DialogTitle className="text-foreground">Ajustar foto do perfil</DialogTitle></DialogHeader>
          {imageSrc && (
            <div className="space-y-4">
              <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete}/>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Zoom:</Label>
                <Slider value={[zoom]} onValueChange={(values) => setZoom(values[0])} min={1} max={3} step={0.1} className="w-full"/>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setImageSrc(null)}>Cancelar</Button>
            <Button onClick={handleCropSave} className="bg-primary hover:bg-primary/90" disabled={isCropping}>
              {isCropping ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para exibir a justificativa da IA */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center font-bold flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Sua Trilha Personalizada!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Com base nas suas respostas, nosso mentor de IA preparou um caminho especial para você.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 px-2 max-h-[60vh] overflow-y-auto pr-4">
            <div className="prose prose-sm dark:prose-invert max-w-none 
               prose-h3:text-foreground prose-h3:uppercase prose-h3:mb-2 prose-h3:mt-6 first-of-type:prose-h3:mt-2">
              <ReactMarkdown>
                {aiJustification}
              </ReactMarkdown>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseAiModal} className="w-full bg-primary hover:bg-primary/90">
              <ThumbsUp className="w-4 h-4 mr-2" />
              Entendi, vamos começar!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompleteProfilePage;