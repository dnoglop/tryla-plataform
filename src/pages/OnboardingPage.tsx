import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Cropper, { Area } from "react-easy-crop";
import ReactMarkdown from "react-markdown";

// UI e Utilitários
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCroppedImg } from "@/lib/cropImage";
import { toast } from "sonner";

// Serviços
import { supabase } from "@/integrations/supabase/client";
import {
  updateProfile,
  uploadAvatar,
  getProfile,
} from "@/services/profileService";
import {
  generatePersonalizedTrack,
  saveUserTrack,
  UserOnboardingData,
} from "@/services/trackService";

// Ícones
import {
  Camera, User, AtSign, Loader2, Sparkles, Brain, Target, Shield, Heart,
  Rocket, Users, ChevronLeft, ChevronRight, BookOpen, Clock, Star,
  ThumbsUp, Calendar, Linkedin, FileText, MapPin,
} from "lucide-react";

// -- Estrutura de Dados e Constantes --
const onboardingSteps = [
  { number: 1, title: "Boas-vindas", subtitle: "A sua grande jornada começa agora" },
  { number: 2, title: "Perfil Básico", subtitle: "Conte-nos sobre você" },
  { number: 3, title: "Seus Objetivos", subtitle: "Defina suas principais metas" },
  { number: 4, title: "Queremos conhecer você", subtitle: "Criando uma experiência única" },
  { number: 5, title: "Confirmação", subtitle: "Hora de decolar!" },
];

const developmentAreas = [
  { id: "autoconfianca", label: "Autoconfiança", icon: Shield },
  { id: "comunicacao", label: "Comunicação", icon: Users },
  { id: "lideranca", label: "Liderança", icon: Rocket },
  { id: "produtividade", label: "Produtividade", icon: Clock },
  { id: "inteligencia_emocional", label: "Inteligência Emocional", icon: Brain, },
  { id: "criatividade", label: "Criatividade", icon: Sparkles },
];
const interestsList = [
  { id: "tecnologia", label: "Tecnologia", icon: Brain },
  { id: "artes", label: "Artes e Cultura", icon: Sparkles },
  { id: "negocios", label: "Negócios", icon: Target },
  { id: "ciencia", label: "Ciências", icon: Rocket },
  { id: "psicologia", label: "Psicologia", icon: Heart },
  { id: "esportes", label: "Esportes", icon: Star },
];
const learningStyles = ["Teoria e reflexão", "Prática e exercícios", "Jogos e desafios", "Uma mistura de tudo",];
const weeklyTimes = ["1-2 horas", "3-5 horas", "6-10 horas", "10+ horas"];
const experienceLevels = [{ value: "iniciante", label: "Iniciante" }, { value: "intermediario", label: "Intermediário" }, { value: "avancado", label: "Avançado" },];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? "100%" : "-100%", opacity: 0 }),
};

// -- Componente Principal --
const OnboardingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState<
    UserOnboardingData & {
      bio: string;
      avatar_url: string;
      linkedin_url: string;
    }
  >({
    full_name: "", username: "", bio: "", avatar_url: "", linkedin_url: "", birth_date: "",
    gender: "", city: "", state: "", career_goal: "", current_challenge: "", hobbies: "",
    development_areas: [], interests: [], learning_style: "", weekly_time: "", experience_level: "",
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiJustification, setAiJustification] = useState("");

  const handleNext = () => { if (!canContinue) return; setDirection(1); if (currentStep < onboardingSteps.length) setCurrentStep((s) => s + 1); };
  const handleBack = () => { setDirection(-1); if (currentStep > 1) setCurrentStep((s) => s - 1); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectToggle = (field: "development_areas" | "interests", value: string) => {
    setProfileData((prev) => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 1: return true;
      case 2: return !!profileData.full_name.trim() && !!profileData.username.trim() && !!profileData.birth_date;
      case 3: return !!profileData.career_goal.trim() && !!profileData.current_challenge.trim();
      case 4: return profileData.development_areas.length > 0 && profileData.interests.length > 0 && !!profileData.learning_style && !!profileData.weekly_time && !!profileData.experience_level;
      case 5: return true;
      default: return false;
    }
  }, [currentStep, profileData]);

  const trackMutation = useMutation({
    mutationFn: generatePersonalizedTrack,
    onSuccess: async (trackData) => {
      if (!userId) return;
      await saveUserTrack(userId, trackData, profileData);
      await queryClient.refetchQueries({ queryKey: ["userAuthStatus"] });
      setAiJustification(trackData.justification_text);
      setIsAiModalOpen(true);
    },
    onError: (error) => toast.error("Erro ao criar sua trilha.", { description: String(error) }),
  });

  const handleSubmit = async () => {
    if (!userId) return;
    try {
      await updateProfile(userId, {
        full_name: profileData.full_name, username: profileData.username, bio: profileData.bio,
        avatar_url: profileData.avatar_url, linkedin_url: profileData.linkedin_url,
        birth_date: profileData.birth_date, gender: profileData.gender,
        city: profileData.city, state: profileData.state,
      });
      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      trackMutation.mutate(profileData);
    } catch (error) {
      toast.error("Ops, tivemos um erro ao salvar seu perfil.");
    }
  };

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const existingProfile = await getProfile(user.id);

      
        setProfileData((prev) => ({
          ...prev,
          full_name: existingProfile?.full_name || user.user_metadata?.full_name || "",
          username: existingProfile?.username || `user${user.id.substring(0, 6)}`,
          avatar_url: existingProfile?.avatar_url || user.user_metadata?.avatar_url || "",
          bio: existingProfile?.bio || "",
          linkedin_url: existingProfile?.linkedin_url || "",
          birth_date: existingProfile?.birth_date || "",
          gender: existingProfile?.gender || "",
          city: existingProfile?.city || "",
          state: existingProfile?.state || "",
        }));
      } else {
        navigate("/login");
      }
      setIsLoading(false);
    };
    getUser();
  }, [navigate]);

  const handleAvatarClick = () => fileInputRef.current?.click();
  const onCropComplete = useCallback((_c: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !userId) return;
    setIsCropping(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const imageUrl = await uploadAvatar(userId, croppedImageBlob);
      setProfileData((prev) => ({ ...prev, avatar_url: `${imageUrl}?t=${new Date().getTime()}` }));
      setImageSrc(null);
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      toast.error("Não foi possível salvar a foto.");
    } finally {
      setIsCropping(false);
    }
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    navigate("/inicio");
  };

  if (isLoading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-16 w-16 text-primary animate-spin" /></div>);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-nunito">
      <div className="w-full max-w-2xl bg-card rounded-3xl shadow-2xl overflow-hidden border border-border/20">
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-foreground">{onboardingSteps[currentStep - 1].title}</h2>
            <span className="text-sm text-muted-foreground font-medium">{currentStep} de {onboardingSteps.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <motion.div className="h-1.5 bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: `${(currentStep / onboardingSteps.length) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }}/>
          </div>
        </div>

        <div className="relative h-[60vh] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 p-4 sm:p-6 overflow-y-auto">
              {currentStep === 1 && (<div className="text-center flex flex-col justify-center items-center h-full"><div className="w-24 h-24 mb-6"><img src="https://i.imgur.com/TmfqRTD.gif" alt="Foguete Tryla" /></div><h1 className="text-3xl font-bold text-foreground mb-4">Bem-vindo(a) à Tryla!</h1><p className="text-muted-foreground max-w-md">Prepare-se para descobrir seus talentos, desenvolver novas habilidades e construir o futuro que você sempre sonhou.</p></div>)}

              {currentStep === 2 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="flex flex-col items-center gap-4">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    <div className="relative w-24 h-24 rounded-full bg-muted border-2 border-primary/20 flex items-center justify-center overflow-hidden cursor-pointer" onClick={handleAvatarClick}>
                      {profileData.avatar_url ? (<img src={profileData.avatar_url} alt="Seu avatar" className="w-full h-full object-cover" />) : (<User className="w-10 h-10 text-muted-foreground" />)}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Camera className="w-6 h-6 text-white" /></div>
                    </div>
                  </div>
                  <div><Label htmlFor="full_name" className="text-sm font-semibold flex items-center gap-2 mb-1"><User className="w-4 h-4" />Nome Completo *</Label><Input id="full_name" name="full_name" value={profileData.full_name} onChange={handleInputChange} placeholder="Seu nome completo" required /></div>
                  <div><Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2 mb-1"><AtSign className="w-4 h-4" />Nome de Usuário *</Label><Input id="username" name="username" value={profileData.username} onChange={handleInputChange} placeholder="@seu_usuario" required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="birth_date" className="text-sm font-semibold flex items-center gap-2 mb-1"><Calendar className="w-4 h-4" />Data de Nascimento *</Label><Input id="birth_date" name="birth_date" type="date" value={profileData.birth_date} onChange={handleInputChange} required /></div>
                    <div><Label htmlFor="gender" className="text-sm font-semibold flex items-center gap-2 mb-1"><Heart className="w-4 h-4" />Gênero</Label><Select name="gender" onValueChange={(v) => handleSelectChange("gender", v)} value={profileData.gender}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Feminino">Feminino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Outro">Outro</SelectItem><SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="city" className="text-sm font-semibold flex items-center gap-2 mb-1"><MapPin className="w-4 h-4" />Cidade</Label><Input id="city" name="city" value={profileData.city} onChange={handleInputChange} placeholder="Ex: São Paulo" /></div>
                    <div><Label htmlFor="state" className="text-sm font-semibold flex items-center gap-2 mb-1"><MapPin className="w-4 h-4" />Estado</Label><Input id="state" name="state" value={profileData.state} onChange={handleInputChange} placeholder="Ex: SP" /></div>
                  </div>
                  <div><Label htmlFor="linkedin_url" className="text-sm font-semibold flex items-center gap-2 mb-1"><Linkedin className="w-4 h-4" />LinkedIn (opcional)</Label><Input id="linkedin_url" name="linkedin_url" type="url" value={profileData.linkedin_url} onChange={handleInputChange} placeholder="https://linkedin.com/in/seu-perfil" /></div>
                  <div><Label htmlFor="bio" className="text-sm font-semibold flex items-center gap-2 mb-1"><FileText className="w-4 h-4" />Sobre mim (opcional)</Label><Textarea id="bio" name="bio" value={profileData.bio} onChange={handleInputChange} placeholder="Fale um pouco sobre você, suas paixões, hobbies e objetivos..." className="min-h-[100px]" /></div>
                </div>
              )}

              {currentStep === 3 && (<div className="space-y-6 max-w-md mx-auto"><div><Label htmlFor="career_goal" className="text-sm font-semibold mb-2 block">Qual é o seu grande sonho de carreira? *</Label><Textarea id="career_goal" name="career_goal" value={profileData.career_goal} onChange={handleInputChange} placeholder="Ex: Ser líder em uma empresa de tecnologia, abrir meu próprio negócio de design..." required className="min-h-[100px]" /></div><div><Label htmlFor="current_challenge" className="text-sm font-semibold mb-2 block">E qual o seu maior desafio hoje para chegar lá? *</Label><Textarea id="current_challenge" name="current_challenge" value={profileData.current_challenge} onChange={handleInputChange} placeholder="Ex: Não sei por onde começar, falta de confiança, dificuldade em me organizar..." required className="min-h-[100px]" /></div><div><Label htmlFor="hobbies" className="text-sm font-semibold mb-2 block">O que você ama fazer no seu tempo livre?</Label><Textarea id="hobbies" name="hobbies" value={profileData.hobbies} onChange={handleInputChange} placeholder="Ex: Jogar, ler, praticar esportes..." className="min-h-[100px]" /></div></div>)}

              {currentStep === 4 && (<div className="space-y-6"><div><Label className="text-sm font-semibold mb-3 block">Quais áreas você mais quer desenvolver? *</Label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{developmentAreas.map((area) => (<button key={area.id} onClick={() => handleMultiSelectToggle("development_areas", area.label)} className={`p-3 rounded-xl border-2 text-left transition-all ${profileData.development_areas.includes(area.label) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}><div className="flex items-center gap-2"><area.icon className={`w-4 h-4 ${profileData.development_areas.includes(area.label) ? "text-primary" : "text-muted-foreground"}`} /><span className="text-sm font-medium">{area.label}</span></div></button>))}</div></div><div><Label className="text-sm font-semibold mb-3 block">Quais temas mais te interessam? *</Label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{interestsList.map((item) => (<button key={item.id} onClick={() => handleMultiSelectToggle("interests", item.label)} className={`p-3 rounded-xl border-2 text-left transition-all ${profileData.interests.includes(item.label) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}><div className="flex items-center gap-2"><item.icon className={`w-4 h-4 ${profileData.interests.includes(item.label) ? "text-primary" : "text-muted-foreground"}`} /><span className="text-sm font-medium">{item.label}</span></div></button>))}</div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label className="text-sm font-semibold mb-2 block">Como você prefere aprender? *</Label><Select name="learning_style" onValueChange={(v) => handleSelectChange("learning_style", v)} value={profileData.learning_style}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{learningStyles.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></div><div><Label className="text-sm font-semibold mb-2 block">Quanto tempo pode dedicar por semana? *</Label><Select name="weekly_time" onValueChange={(v) => handleSelectChange("weekly_time", v)} value={profileData.weekly_time}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{weeklyTimes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent></Select></div><div><Label className="text-sm font-semibold mb-2 block">Qual seu nível de experiência? *</Label><Select name="experience_level" onValueChange={(v) => handleSelectChange("experience_level", v)} value={profileData.experience_level}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{experienceLevels.map((e) => (<SelectItem key={e.value} value={e.label}>{e.label}</SelectItem>))}</SelectContent></Select></div></div></div>)}

              {currentStep === 5 && (<div className="text-center flex flex-col justify-center items-center h-full"><div className="w-24 h-24 mb-6"><Sparkles className="w-full h-full text-primary" /></div><h1 className="text-3xl font-bold text-foreground mb-4">Tudo pronto, {profileData.full_name.split(" ")[0]}!</h1><p className="text-muted-foreground max-w-md">Sua jornada personalizada está prestes a ser criada. Clique no botão abaixo para que nossa IA prepare o caminho ideal para o seu sucesso.</p></div>)}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-4 sm:p-6 border-t border-border flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="disabled:opacity-40"><ChevronLeft className="w-4 h-4 mr-2" />Voltar</Button>
          {currentStep < onboardingSteps.length ? (<Button onClick={handleNext} disabled={!canContinue} className="bg-primary hover:bg-primary/90">Continuar<ChevronRight className="w-4 h-4 ml-2" /></Button>) : (<Button onClick={handleSubmit} disabled={trackMutation.isPending} className="bg-primary hover:bg-primary/90 min-w-[200px]">{trackMutation.isPending ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Criando sua trilha...</>) : (<>Finalizar e Criar Trilha<Sparkles className="w-4 h-4 ml-2" /></>)}</Button>)}
        </div>
      </div>

      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && setImageSrc(null)}>
        <DialogContent className="sm:max-w-md bg-card"><DialogHeader><DialogTitle className="text-foreground">Ajustar foto do perfil</DialogTitle></DialogHeader>{imageSrc && (<div className="space-y-4"><div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden"><Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} /></div><div className="space-y-2"><Label className="text-sm font-medium text-foreground">Zoom:</Label><Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={1} max={3} step={0.1} /></div></div>)}<DialogFooter className="flex gap-2"><Button variant="outline" onClick={() => setImageSrc(null)}>Cancelar</Button><Button onClick={handleCropSave} className="bg-primary hover:bg-primary/90" disabled={isCropping}>{isCropping ? (<Loader2 className="w-4 h-4 animate-spin" />) : ("Salvar")}</Button></DialogFooter></DialogContent>
      </Dialog>
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card"><DialogHeader><DialogTitle className="text-2xl text-center font-bold flex items-center justify-center gap-2"><Sparkles className="w-6 h-6 text-primary" />Sua Trilha Personalizada!</DialogTitle><DialogDescription className="text-center pt-2">Com base em suas respostas, preparei um caminho especial para você.</DialogDescription></DialogHeader><div className="py-4 px-2 max-h-[60vh] overflow-y-auto pr-4"><div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-foreground prose-h3:uppercase prose-h3:mb-2 prose-h3:mt-6 first-of-type:prose-h3:mt-2"><ReactMarkdown>{aiJustification}</ReactMarkdown></div></div><DialogFooter><Button onClick={handleCloseAiModal} className="w-full bg-primary hover:bg-primary/90"><ThumbsUp className="w-4 h-4 mr-2" />Beleza, vamos começar!</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
};

export default OnboardingPage;