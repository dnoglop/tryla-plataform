import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { 
  Calendar, 
  Edit, 
  FilePlus, 
  PlusCircle, 
  Trash2, 
  Video, 
  Search,
  BarChart3,
  Users,
  FileText,
  BrainCircuit,
  Star
} from "lucide-react";
import ProgressBar from "@/components/ProgressBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminChart from "@/components/AdminChart";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createModule, 
  updateModule, 
  deleteModule, 
  getModules,
  createPhase,
  updatePhase,
  deletePhase,
  getPhasesByModuleId,
  saveQuiz,
  getQuestionsByPhaseId,
  Module,
  Phase
} from "@/services/moduleService";

const AdminPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();
  
  // Estado para gerenciar os módulos e fases
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  
  // Estado para gerenciar as fases em edição
  const [selectedModule, setSelectedModule] = useState<number>(1);
  const [phaseName, setPhaseName] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [phaseType, setPhaseType] = useState<"video" | "text" | "quiz" | "challenge">("text");
  const [iconType, setIconType] = useState<"video" | "quiz" | "challenge" | "game">("video");
  const [phaseDuration, setPhaseDuration] = useState<number>(15);
  
  // Estado para gerenciar os quizzes
  const [editingQuiz, setEditingQuiz] = useState<{
    phaseId: number;
    questions: {
      id?: number;
      question: string;
      options: string[];
      correct_answer: number;
      order_index: number;
    }[];
  } | null>(null);
  
  // Estado para gerenciar os eventos da comunidade
  const [communityEvents, setCommunityEvents] = useState([
    { 
      id: 1, 
      title: "Workshop de Comunicação", 
      date: "2025-04-15", 
      time: "15:00", 
      description: "Aprenda técnicas para se comunicar melhor em entrevistas de emprego",
      location: "Online (Zoom)"
    },
    { 
      id: 2, 
      title: "Roda de Conversa: Mercado de Trabalho", 
      date: "2025-04-20", 
      time: "16:30", 
      description: "Vamos conversar sobre o mercado de trabalho para jovens",
      location: "Centro Comunitário"
    }
  ]);

  // Dados para os gráficos
  const usersData = [
    { name: "Jan", value: 150 },
    { name: "Fev", value: 220 },
    { name: "Mar", value: 280 },
    { name: "Abr", value: 360 },
    { name: "Mai", value: 320 },
    { name: "Jun", value: 390 },
    { name: "Jul", value: 450 }
  ];

  const completionsData = [
    { name: "Jan", value: 80 },
    { name: "Fev", value: 120 },
    { name: "Mar", value: 180 },
    { name: "Abr", value: 250 },
    { name: "Mai", value: 230 },
    { name: "Jun", value: 320 },
    { name: "Jul", value: 380 }
  ];

  const engagementData = [
    { name: "Jan", value: 65 },
    { name: "Fev", value: 72 },
    { name: "Mar", value: 68 },
    { name: "Abr", value: 75 },
    { name: "Mai", value: 70 },
    { name: "Jun", value: 82 },
    { name: "Jul", value: 78 }
  ];
  
  // Form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Módulo em edição
  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleType, setModuleType] = useState("autoconhecimento");
  const [moduleEmoji, setModuleEmoji] = useState("🧠");
  
  // Estado para destacar quais módulos e fases têm mais engajamento
  const [topModules, setTopModules] = useState([
    { id: 1, name: "Autoconhecimento", completions: 327, engagement: 85 },
    { id: 2, name: "Empatia", completions: 245, engagement: 72 },
    { id: 4, name: "Comunicação", completions: 152, engagement: 68 },
    { id: 3, name: "Growth Mindset", completions: 127, engagement: 63 },
  ]);
  
  const [topPhases, setTopPhases] = useState([
    { id: 1, moduleId: 1, name: "Quem sou eu?", completions: 198, rating: 4.8 },
    { id: 2, moduleId: 1, name: "Reconhecendo emoções", completions: 165, rating: 4.6 },
    { id: 5, moduleId: 4, name: "Comunicação assertiva", completions: 142, rating: 4.7 },
    { id: 3, moduleId: 2, name: "Entendendo o outro", completions: 135, rating: 4.5 },
  ]);

  // Data fetching using React Query
  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
  });

  const { data: phases = [], refetch: refetchPhases } = useQuery({
    queryKey: ['phases', selectedModule],
    queryFn: () => getPhasesByModuleId(selectedModule),
    enabled: !!selectedModule,
  });

  // Mutations
  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({
        title: "Módulo adicionado",
        description: "O módulo foi adicionado com sucesso"
      });
      clearModuleForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar módulo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, module }: { id: number; module: Partial<Module> }) => 
      updateModule(id, module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({
        title: "Módulo atualizado",
        description: "O módulo foi atualizado com sucesso"
      });
      clearModuleForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar módulo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast({
        title: "Módulo removido",
        description: "O módulo foi removido com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover módulo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createPhaseMutation = useMutation({
    mutationFn: createPhase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', selectedModule] });
      toast({
        title: "Fase adicionada",
        description: "A fase foi adicionada com sucesso ao módulo selecionado"
      });
      resetPhaseForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar fase",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: Partial<Phase> }) => 
      updatePhase(id, phase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      toast({
        title: "Fase atualizada",
        description: "A fase foi atualizada com sucesso"
      });
      resetPhaseForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar fase",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deletePhaseMutation = useMutation({
    mutationFn: deletePhase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      toast({
        title: "Fase removida",
        description: "A fase foi removida com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover fase",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveQuizMutation = useMutation({
    mutationFn: ({ phaseId, questions }: { phaseId: number; questions: any[] }) =>
      saveQuiz(phaseId, questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast({
        title: "Quiz salvo",
        description: "O quiz foi salvo com sucesso"
      });
      setEditingQuiz(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddPhase = () => {
    if (!phaseName || !phaseDescription) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e a descrição da fase",
        variant: "destructive"
      });
      return;
    }
    
    const newPhase = {
      module_id: selectedModule,
      name: phaseName,
      description: phaseDescription,
      type: phaseType,
      icon_type: iconType,
      content: content,
      video_url: videoUrl,
      duration: phaseDuration,
      order_index: phases.length
    };
    
    createPhaseMutation.mutate(newPhase);
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setSelectedModule(phase.module_id);
    setPhaseName(phase.name);
    setPhaseDescription(phase.description || "");
    setPhaseType(phase.type);
    setIconType(phase.icon_type);
    setVideoUrl(phase.video_url || "");
    setContent(phase.content || "");
    setPhaseDuration(phase.duration || 15);
    setActiveTab("conteudo");
  };

  const handleUpdatePhase = () => {
    if (!editingPhase || !phaseName || !phaseDescription) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e a descrição da fase",
        variant: "destructive"
      });
      return;
    }
    
    const updatedPhase = {
      module_id: selectedModule,
      name: phaseName,
      description: phaseDescription,
      type: phaseType,
      icon_type: iconType,
      content: content,
      video_url: videoUrl,
      duration: phaseDuration,
    };
    
    updatePhaseMutation.mutate({
      id: editingPhase.id,
      phase: updatedPhase
    });
  };
  
  const resetPhaseForm = () => {
    setEditingPhase(null);
    setPhaseName("");
    setPhaseDescription("");
    setVideoUrl("");
    setContent("");
    setPhaseType("text");
    setIconType("video");
    setPhaseDuration(15);
  };

  const handleAddEvent = () => {
    if (!eventTitle || !eventDate || !eventDescription) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o título, data e descrição do evento",
        variant: "destructive"
      });
      return;
    }
    
    const newEvent = {
      id: communityEvents.length + 1,
      title: eventTitle,
      date: eventDate,
      time: eventTime,
      description: eventDescription,
      location: eventLocation
    };
    
    setCommunityEvents([...communityEvents, newEvent]);
    
    // Reset form
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventDescription("");
    setEventLocation("");
    
    toast({
      title: "Evento adicionado",
      description: "O evento foi adicionado com sucesso à comunidade"
    });
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleName(module.name);
    setModuleDescription(module.description || "");
    setModuleType(module.type || "autoconhecimento");
    setModuleEmoji(module.emoji || "🧠");
    setActiveTab("modulos");
  };

  const handleUpdateModule = () => {
    if (!editingModule || !moduleName || !moduleDescription) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e a descrição do módulo",
        variant: "destructive"
      });
      return;
    }
    
    const updatedModule = {
      name: moduleName,
      description: moduleDescription,
      type: moduleType as "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro",
      emoji: moduleEmoji
    };
    
    updateModuleMutation.mutate({
      id: editingModule.id,
      module: updatedModule
    });
  };

  const clearModuleForm = () => {
    setEditingModule(null);
    setModuleName("");
    setModuleDescription("");
    setModuleType("autoconhecimento");
    setModuleEmoji("🧠");
  };

  const handleAddModule = () => {
    if (!moduleName || !moduleDescription) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e a descrição do módulo",
        variant: "destructive"
      });
      return;
    }
    
    const lastOrderIndex = modules.length > 0 
      ? Math.max(...modules.map(m => m.order_index || 0)) + 1 
      : 0;
    
    const newModule = {
      name: moduleName,
      description: moduleDescription,
      type: moduleType as "autoconhecimento" | "empatia" | "growth" | "comunicacao" | "futuro",
      emoji: moduleEmoji,
      order_index: lastOrderIndex
    };
    
    createModuleMutation.mutate(newModule);
  };

  const handleQuizEdit = async (phaseId: number) => {
    try {
      const questions = await getQuestionsByPhaseId(phaseId);
      
      if (questions.length > 0) {
        setEditingQuiz({
          phaseId,
          questions
        });
      } else {
        // Create a new quiz for the phase
        setEditingQuiz({
          phaseId,
          questions: [
            {
              question: "",
              options: ["", "", "", ""],
              correct_answer: 0,
              order_index: 0
            }
          ]
        });
      }
      
      setActiveTab("quizzes");
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as perguntas do quiz",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    
    // Validate questions
    const invalidQuestions = editingQuiz.questions.filter(
      q => !q.question || q.options.some(o => !o)
    );
    
    if (invalidQuestions.length > 0) {
      toast({
        title: "Dados inválidos",
        description: "Preencha todas as perguntas e opções",
        variant: "destructive"
      });
      return;
    }
    
    saveQuizMutation.mutate({
      phaseId: editingQuiz.phaseId,
      questions: editingQuiz.questions
    });
  };

  const addQuestion = () => {
    if (!editingQuiz) return;
    
    const newQuestion = {
      question: "",
      options: ["", "", "", ""],
      correct_answer: 0,
      order_index: editingQuiz.questions.length
    };
    
    setEditingQuiz({
      ...editingQuiz,
      questions: [...editingQuiz.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    if (!editingQuiz) return;
    
    const updatedQuestions = editingQuiz.questions.map((q, i) => {
      if (i === index) {
        if (field === "question") {
          return { ...q, question: value as string };
        } else if (field === "correctAnswer") {
          return { ...q, correct_answer: value as number };
        } else if (field.startsWith("option")) {
          const optionIndex = parseInt(field.replace("option", ""));
          const newOptions = [...q.options];
          newOptions[optionIndex] = value as string;
          return { ...q, options: newOptions };
        }
      }
      return q;
    });
    
    setEditingQuiz({
      ...editingQuiz,
      questions: updatedQuestions
    });
  };

  const removeQuestion = (index: number) => {
    if (!editingQuiz || editingQuiz.questions.length <= 1) return;
    
    const updatedQuestions = editingQuiz.questions.filter((_, i) => i !== index);
    
    setEditingQuiz({
      ...editingQuiz,
      questions: updatedQuestions
    });
  };

  const deleteEvent = (id: number) => {
    setCommunityEvents(communityEvents.filter(event => event.id !== id));
    toast({
      title: "Evento removido",
      description: "O evento foi removido com sucesso"
    });
  };

  const getModuleNameById = (id: number) => {
    return modules.find(m => m.id === id)?.name || "Módulo Desconhecido";
  };

  const getPhaseNameById = (id: number) => {
    return phases.find(p => p.id === id)?.name || "Fase Desconhecida";
  };
  
  return (
    <div className="container px-4 py-6 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-trilha-orange">Painel de Administração</h1>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Voltar ao App
        </Button>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-5">
          <TabsTrigger value="dashboard" className="flex gap-2 items-center">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="modulos" className="flex gap-2 items-center">
            <BrainCircuit className="h-4 w-4" /> Módulos
          </TabsTrigger>
          <TabsTrigger value="conteudo" className="flex gap-2 items-center">
            <FilePlus className="h-4 w-4" /> Conteúdos
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex gap-2 items-center">
            <FileText className="h-4 w-4" /> Quizzes
          </TabsTrigger>
          <TabsTrigger value="eventos" className="flex gap-2 items-center">
            <Calendar className="h-4 w-4" /> Eventos
          </TabsTrigger>
        </TabsList>
        
        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard">
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Total de Usuários</h3>
                  <Users className="h-5 w-5 text-trilha-orange" />
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold">450</p>
                  <p className="text-sm text-green-600">+12% este mês</p>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Fases Completadas</h3>
                  <Star className="h-5 w-5 text-trilha-orange" />
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold">1,283</p>
                  <p className="text-sm text-green-600">+23% este mês</p>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Taxa de Engajamento</h3>
                  <BrainCircuit className="h-5 w-5 text-trilha-orange" />
                </div>
                <div className="mt-2">
                  <p className="text-3xl font-bold">78%</p>
                  <p className="text-sm text-green-600">+5% este mês</p>
                </div>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <AdminChart 
                data={usersData} 
                title="Novos Usuários" 
                color="#F97316"
                growth={{ value: 12, positive: true }}
              />
              
              <AdminChart 
                data={completionsData} 
                title="Fases Completadas" 
                color="#3B82F6"
                growth={{ value: 23, positive: true }}
              />
              
              <AdminChart 
                data={engagementData} 
                title="Taxa de Engajamento (%)" 
                color="#10B981"
                growth={{ value: 5, positive: true }}
              />
            </div>
            
            {/* Top Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Módulos Mais Populares</h3>
                <div className="space-y-4">
                  {topModules.map((module, index) => (
                    <div key={module.id} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{index + 1}. {module.name}</span>
                        <span className="text-sm text-gray-500">{module.completions} completados</span>
                      </div>
                      <ProgressBar progress={module.engagement} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </Card>
              
              {/* Top Phases */}
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Fases Melhor Avaliadas</h3>
                <div className="space-y-4">
                  {topPhases.map((phase) => (
                    <div key={phase.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{phase.name}</p>
                        <p className="text-sm text-gray-500">{getModuleNameById(phase.moduleId)}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span>{phase.rating}</span>
                        <Badge variant="outline" className="ml-2">
                          {phase.completions} completados
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* MÓDULOS TAB */}
        <TabsContent value="modulos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {editingModule ? "Editar Módulo" : "Adicionar Módulo"}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="moduleName">Nome do Módulo</Label>
                    <Input
                      id="moduleName"
                      placeholder="Ex: Autoconhecimento"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="moduleDescription">Descrição</Label>
                    <Textarea
                      id="moduleDescription"
                      placeholder="Ex: Conheça suas forças, fraquezas e o que te move"
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="moduleType">Tipo</Label>
                    <select
                      id="moduleType"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={moduleType}
                      onChange={(e) => setModuleType(e.target.value)}
                    >
                      <option value="autoconhecimento">Autoconhecimento</option>
                      <option value="empatia">Empatia</option>
                      <option value="growth">Growth Mindset</option>
                      <option value="comunicacao">Comunicação</option>
                      <option value="futuro">Módulo Futuro</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="moduleEmoji">Emoji</Label>
                    <Input
                      id="moduleEmoji"
                      placeholder="Ex: 🧠"
                      value={moduleEmoji}
                      onChange={(e) => setModuleEmoji(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={editingModule ? handleUpdateModule : handleAddModule} 
                    className="w-full bg-trilha-orange hover:bg-trilha-orange/90"
                  >
                    {editingModule ? "Atualizar Módulo" : "Adicionar Módulo"}
                  </Button>
                  
                  {editingModule && (
                    <Button 
                      variant="outline"
                      onClick={clearModuleForm}
                      className="w-full"
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Módulos Cadastrados</h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar módulos..."
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Fases</TableHead>
                        <TableHead>Progresso Médio</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => {
                        const modulePhases = phases.filter(phase => phase.module_id === module.id);
                        const avgProgress = topModules.find(m => m.id === module.id)?.engagement || 0;
                        
                        return (
                          <TableRow key={module.id}>
                            <TableCell>{module.id}</TableCell>
                            <TableCell className="font-medium">{module.name}</TableCell>
                            <TableCell>{modulePhases.length}</TableCell>
                            <TableCell>
                              <div className="w-32">
                                <ProgressBar progress={avgProgress} className="h-1.5" />
                                <div className="text-xs text-right mt-1">
                                  {avgProgress}%
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditModule(module)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/modulo/${module.id}`)}
                                >
                                  Visualizar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => deleteModuleMutation.mutate(module.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* CONTEÚDOS TAB */}
        <TabsContent value="conteudo">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {editingPhase ? "Editar Fase" : "Adicionar Nova Fase"}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="module">Módulo</Label>
                    <select
                      id="module"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(Number(e.target.value))}
                    >
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>{module.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="phaseName">Nome da Fase</Label>
                    <Input
                      id="phaseName
