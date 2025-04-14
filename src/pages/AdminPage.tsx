
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminChart from "@/components/AdminChart";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PhaseForm from "@/components/PhaseForm";
import ModuleForm from "@/components/ModuleForm";
import { 
  getModules, 
  getPhasesByModuleId, 
  createModule, 
  updateModule, 
  deleteModule, 
  createPhase as createPhaseFunc, 
  updatePhase as updatePhaseFunc, 
  deletePhase, 
  saveQuiz as saveQuizFunc,
  getQuestionsByPhaseId as getQuestionsByPhaseIdFunc,
  Phase,
  PhaseType,
  IconType,
  ModuleType,
  Module
} from "@/services/moduleService";
import { 
  BarChart3, 
  BrainCircuit, 
  FilePlus, 
  FileText, 
  Calendar, 
  Users, 
  Star, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Search, 
  PlusCircle, 
  Edit2
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import ProgressBar from "@/components/ProgressBar";

const AdminPage = () => {
  const { toast: toastHook } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();
  
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  
  const [selectedModule, setSelectedModule] = useState<number>(1);
  const [phaseName, setPhaseName] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [phaseType, setPhaseType] = useState<PhaseType>("text");
  const [iconType, setIconType] = useState<IconType>("video");
  const [phaseDuration, setPhaseDuration] = useState<number>(15);
  
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
  
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");

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

  const { data: modules = [] } = useQuery({
    queryKey: ['modules'],
    queryFn: getModules,
  });

  const { data: phases = [], refetch: refetchPhases } = useQuery({
    queryKey: ['phases', selectedModule],
    queryFn: () => getPhasesByModuleId(selectedModule),
    enabled: !!selectedModule,
  });

  const createModuleMutation = useMutation({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toastHook({
        title: "Módulo adicionado",
        description: "O módulo foi adicionado com sucesso"
      });
      clearModuleForm();
    },
    onError: (error) => {
      toastHook({
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
      toastHook({
        title: "Módulo atualizado",
        description: "O módulo foi atualizado com sucesso"
      });
      clearModuleForm();
    },
    onError: (error) => {
      toastHook({
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
      toastHook({
        title: "Módulo removido",
        description: "O módulo foi removido com sucesso"
      });
    },
    onError: (error) => {
      toastHook({
        title: "Erro ao remover módulo",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createPhaseMutation = useMutation({
    mutationFn: createPhaseFunc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases', selectedModule] });
      toastHook({
        title: "Fase adicionada",
        description: "A fase foi adicionada com sucesso ao módulo selecionado"
      });
      resetPhaseForm();
    },
    onError: (error) => {
      toastHook({
        title: "Erro ao adicionar fase",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, phase }: { id: number; phase: Partial<Phase> }) => 
      updatePhaseFunc(id, phase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      toastHook({
        title: "Fase atualizada",
        description: "A fase foi atualizada com sucesso"
      });
      resetPhaseForm();
    },
    onError: (error) => {
      toastHook({
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
      toastHook({
        title: "Fase removida",
        description: "A fase foi removida com sucesso"
      });
    },
    onError: (error) => {
      toastHook({
        title: "Erro ao remover fase",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const saveQuizMutation = useMutation({
    mutationFn: ({ phaseId, questions }: { phaseId: number; questions: any[] }) =>
      saveQuizFunc(phaseId, questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toastHook({
        title: "Quiz salvo",
        description: "O quiz foi salvo com sucesso"
      });
      setEditingQuiz(null);
    },
    onError: (error) => {
      toastHook({
        title: "Erro ao salvar quiz",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddPhase = () => {
    if (!phaseName || !phaseDescription) {
      toastHook({
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
    
    createPhaseMutation.mutate(newPhase as any);
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setSelectedModule(phase.module_id || 0);
    setPhaseName(phase.name);
    setPhaseDescription(phase.description || "");
    setPhaseType(phase.type as PhaseType || "video");
    setIconType(phase.icon_type as IconType || "video");
    setVideoUrl(phase.video_url || "");
    setContent(phase.content || "");
    setPhaseDuration(phase.duration || 15);
    setActiveTab("conteudo");
  };

  const handleUpdatePhase = () => {
    if (!editingPhase || !phaseName || !phaseDescription) {
      toastHook({
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
      toastHook({
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
    
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventDescription("");
    setEventLocation("");
    
    toastHook({
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
      toastHook({
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
      toastHook({
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
      console.log("Buscando perguntas para a fase:", phaseId);
      const questions = await getQuestionsByPhaseIdFunc(phaseId);
      console.log("Perguntas recebidas:", questions);
      
      // Verifica se questions é um array válido
      if (Array.isArray(questions) && questions.length > 0) {
        // Verifica se cada pergunta tem opções válidas
        const validQuestions = questions.map(q => {
          // Se options não for um array, converte para array
          if (!Array.isArray(q.options)) {
            console.log("Convertendo opções para array:", q.options);
            // Tenta converter string JSON para array se for string
            try {
              if (typeof q.options === 'string') {
                q.options = JSON.parse(q.options);
              } else {
                // Fallback para array vazio se não for possível converter
                q.options = ["", "", "", ""];
              }
            } catch (e) {
              console.error("Erro ao converter opções:", e);
              q.options = ["", "", "", ""];
            }
          }
          return q;
        });
        
        setEditingQuiz({
          phaseId,
          questions: validQuestions
        });
      } else {
        // Cria um quiz vazio se não houver perguntas
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
      toastHook({
        title: "Erro",
        description: "Não foi possível carregar as perguntas do quiz",
        variant: "destructive"
      });
      
      // Mesmo com erro, cria um quiz vazio para permitir edição
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
      setActiveTab("quizzes");
    }
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    
    const invalidQuestions = editingQuiz.questions.filter(
      q => !q.question || q.options.some(o => !o)
    );
    
    if (invalidQuestions.length > 0) {
      toastHook({
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
    toastHook({
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

  const handlePhaseTypeChange = (value: PhaseType) => {
    setPhaseType(value);
  };

  const handleIconTypeChange = (value: IconType) => {
    setIconType(value);
  };

  const [moduleName, setModuleName] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleType, setModuleType] = useState("autoconhecimento");
  const [moduleEmoji, setModuleEmoji] = useState("🧠");

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
        
        <TabsContent value="dashboard">
          <div className="space-y-6">
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
        
        <TabsContent value="modulos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {editingModule ? "Editar Módulo" : "Adicionar Módulo"}
                </h2>
                
                <ModuleForm
                  module={editingModule}
                  onSuccess={() => {
                    setActiveTab("modulos");
                    clearModuleForm();
                  }}
                />
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
        
        <TabsContent value="conteudo">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {editingPhase ? "Editar Fase" : "Adicionar Nova Fase"}
                </h2>
                
                {/* Adicionar o seletor de módulos para filtrar fases */}
                <div className="mb-4">
                  <Label htmlFor="module-selector">Selecionar Módulo</Label>
                  <Select 
                    value={selectedModule.toString()} 
                    onValueChange={(value) => setSelectedModule(parseInt(value))}
                  >
                    <SelectTrigger id="module-selector">
                      <SelectValue placeholder="Selecione um módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(module => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione o módulo ao qual deseja adicionar novas fases
                  </p>
                </div>
                
                <PhaseForm
                  moduleId={selectedModule}
                  phase={editingPhase || undefined}
                  onSuccess={() => {
                    refetchPhases();
                    resetPhaseForm();
                  }}
                  onCancel={resetPhaseForm}
                />
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Fases do Módulo: {getModuleNameById(selectedModule)}
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar fases..."
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
                        <TableHead>Tipo</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases.map((phase) => (
                        <TableRow key={phase.id}>
                          <TableCell>{phase.id}</TableCell>
                          <TableCell className="font-medium">{phase.name}</TableCell>
                          <TableCell>
                            {phase.type === "text" ? "Texto" : 
                             phase.type === "video" ? "Vídeo" : 
                             phase.type === "quiz" ? "Quiz" : "Desafio"}
                          </TableCell>
                          <TableCell>{phase.duration || 15} min</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPhase(phase)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              {phase.type === "quiz" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleQuizEdit(phase.id)}
                                >
                                  Editar Quiz
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="quizzes">
          {/* Quiz content goes here */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">
                  {editingQuiz ? `Editar Quiz: ${getPhaseNameById(editingQuiz.phaseId)}` : "Selecione uma fase para editar o quiz"}
                </h2>
                
                {/* Seletor de módulo para filtrar fases com quiz */}
                <div className="mb-4">
                  <Label htmlFor="quiz-module-selector">Filtrar por Módulo</Label>
                  <Select 
                    value={selectedModule.toString()} 
                    onValueChange={(value) => setSelectedModule(parseInt(value))}
                  >
                    <SelectTrigger id="quiz-module-selector">
                      <SelectValue placeholder="Selecione um módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(module => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Lista de fases tipo quiz do módulo selecionado */}
                <div className="space-y-4 mt-4">
                  <h3 className="font-medium">Fases com Quiz</h3>
                  {phases
                    .filter(phase => phase.type === "quiz" && phase.module_id === selectedModule)
                    .map(phase => (
                      <Card key={phase.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{phase.name}</p>
                            <p className="text-sm text-gray-500">{getModuleNameById(phase.module_id || 0)}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleQuizEdit(phase.id)}
                          >
                            Editar Quiz
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {editingQuiz ? (
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                      Perguntas do Quiz
                    </h2>
                    <Button 
                      variant="outline"
                      onClick={addQuestion}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adicionar Pergunta
                    </Button>
                  </div>
                  
                  {editingQuiz.questions.map((question, index) => (
                    <div key={index} className="mb-6 p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Pergunta {index + 1}</h3>
                        {editingQuiz.questions.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remover
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`question-${index}`}>Pergunta</Label>
                          <Input
                            id={`question-${index}`}
                            value={question.question}
                            onChange={(e) => updateQuestion(index, "question", e.target.value)}
                            placeholder="Digite a pergunta"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Opções</Label>
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <Input
                                value={option}
                                onChange={(e) => updateQuestion(index, `option${optionIndex}`, e.target.value)}
                                placeholder={`Opção ${optionIndex + 1}`}
                                className={optionIndex === question.correct_answer ? "border-green-500" : ""}
                              />
                              <Button
                                type="button"
                                variant={optionIndex === question.correct_answer ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateQuestion(index, "correctAnswer", optionIndex)}
                              >
                                {optionIndex === question.correct_answer ? "Correta" : "Marcar"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setEditingQuiz(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateQuiz}>
                      Salvar Quiz
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium">Selecione um Quiz para Editar</h3>
                    <p className="text-gray-500 mt-1">
                      Clique em "Editar Quiz" em uma das fases disponíveis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="eventos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Adicionar Evento</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-title">Título do Evento</Label>
                    <Input
                      id="event-title"
                      placeholder="Digite o título do evento"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="event-date">Data</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Horário</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="event-location">Local</Label>
                    <Input
                      id="event-location"
                      placeholder="Local do evento (presencial ou online)"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="event-description">Descrição</Label>
                    <Textarea
                      id="event-description"
                      placeholder="Descreva detalhes sobre o evento"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-2"
                    onClick={handleAddEvent}
                  >
                    Adicionar Evento
                  </Button>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="p-4">
                <h2 className="text-lg font-semibold mb-4">Eventos Cadastrados</h2>
                
                <div className="space-y-4">
                  {communityEvents.length > 0 ? (
                    communityEvents.map((event) => (
                      <Card key={event.id} className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <p className="text-sm text-gray-500">{event.date} às {event.time}</p>
                            <p className="text-sm mt-1">{event.description}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              <span className="font-medium">Local:</span> {event.location}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 h-8 w-8 p-0"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">Nenhum Evento Cadastrado</h3>
                      <p className="text-gray-500 mt-1">
                        Adicione eventos para a comunidade no formulário ao lado
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
