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

const AdminPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Estado para gerenciar os módulos
  const [modules, setModules] = useState([
    { id: 1, name: "Autoconhecimento" },
    { id: 2, name: "Empatia" },
    { id: 3, name: "Growth Mindset" },
    { id: 4, name: "Comunicação" },
    { id: 5, name: "Módulo Futuro" }
  ]);
  
  // Estado para gerenciar as fases
  const [phases, setPhases] = useState([
    { id: 1, moduleId: 1, name: "Fase 1 - Quem sou eu?", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Texto sobre autoconhecimento" },
    { id: 2, moduleId: 1, name: "Fase 2 - Reconhecendo emoções", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", content: "Texto sobre emoções" },
    { id: 3, moduleId: 2, name: "Fase 1 - Entendendo o outro", videoUrl: "", content: "Texto sobre empatia" }
  ]);

  // Estado para gerenciar os módulos em edição
  const [editingModule, setEditingModule] = useState<{
    id: number;
    name: string;
    description: string;
    type: string;
    emoji: string;
  } | null>(null);
  
  // Estado para gerenciar as fases em edição
  const [editingPhase, setEditingPhase] = useState<{
    id: number;
    moduleId: number;
    name: string;
    videoUrl: string;
    content: string;
  } | null>(null);
  
  // Estado para gerenciar os quizzes
  const [quizzes, setQuizzes] = useState([
    { 
      id: 1, 
      phaseId: 1, 
      questions: [
        { 
          question: "O que é autoconhecimento?", 
          options: [
            "Conhecer outras pessoas", 
            "Entender seus próprios comportamentos e emoções", 
            "Aprender sobre história", 
            "Estudar geografia"
          ],
          correctAnswer: 1
        }
      ]
    }
  ]);

  // Estado para gerenciar o quiz em edição
  const [editingQuiz, setEditingQuiz] = useState<{
    id: number;
    phaseId: number;
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
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
  const [selectedModule, setSelectedModule] = useState(1);
  const [phaseName, setPhaseName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  
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

  const handleAddPhase = () => {
    if (!phaseName || !content) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e o conteúdo da fase",
        variant: "destructive"
      });
      return;
    }
    
    const newPhase = {
      id: phases.length + 1,
      moduleId: selectedModule,
      name: phaseName,
      videoUrl,
      content
    };
    
    setPhases([...phases, newPhase]);
    
    // Reset form
    setPhaseName("");
    setVideoUrl("");
    setContent("");
    
    toast({
      title: "Fase adicionada",
      description: "A fase foi adicionada com sucesso ao módulo selecionado"
    });
  };

  const handleEditPhase = (phase: any) => {
    setEditingPhase(phase);
    setSelectedModule(phase.moduleId);
    setPhaseName(phase.name);
    setVideoUrl(phase.videoUrl);
    setContent(phase.content);
    setActiveTab("conteudo");
  };

  const handleUpdatePhase = () => {
    if (!editingPhase || !phaseName || !content) {
      toast({
        title: "Campos incompletos",
        description: "Preencha pelo menos o nome e o conteúdo da fase",
        variant: "destructive"
      });
      return;
    }
    
    const updatedPhases = phases.map(phase => 
      phase.id === editingPhase.id 
        ? { ...phase, moduleId: selectedModule, name: phaseName, videoUrl, content } 
        : phase
    );
    
    setPhases(updatedPhases);
    
    // Reset form
    setEditingPhase(null);
    setPhaseName("");
    setVideoUrl("");
    setContent("");
    
    toast({
      title: "Fase atualizada",
      description: "A fase foi atualizada com sucesso"
    });
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

  const handleEditModule = (module: any) => {
    const moduleDetails = {
      id: module.id,
      name: module.name,
      description: "",
      type: "autoconhecimento",
      emoji: "🧠"
    };
    
    // Para um caso real, você buscaria os detalhes completos do módulo do backend
    if (module.id === 1) {
      moduleDetails.description = "Conheça suas forças, fraquezas e o que te move";
      moduleDetails.type = "autoconhecimento";
      moduleDetails.emoji = "🧠";
    } else if (module.id === 2) {
      moduleDetails.description = "Desenvolva a capacidade de entender pessoas";
      moduleDetails.type = "empatia";
      moduleDetails.emoji = "❤️";
    } else if (module.id === 3) {
      moduleDetails.description = "Desbloqueie seu potencial de crescimento contínuo";
      moduleDetails.type = "growth";
      moduleDetails.emoji = "🌱";
    } else if (module.id === 4) {
      moduleDetails.description = "Aprenda a comunicação eficaz e persuasiva";
      moduleDetails.type = "comunicacao";
      moduleDetails.emoji = "💬";
    }
    
    setEditingModule(moduleDetails);
    setModuleName(moduleDetails.name);
    setModuleDescription(moduleDetails.description);
    setModuleType(moduleDetails.type);
    setModuleEmoji(moduleDetails.emoji);
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
    
    const updatedModules = modules.map(module => 
      module.id === editingModule.id 
        ? { ...module, name: moduleName } 
        : module
    );
    
    setModules(updatedModules);
    
    // Reset form
    clearModuleForm();
    
    toast({
      title: "Módulo atualizado",
      description: "O módulo foi atualizado com sucesso"
    });
  };
  
  const deleteModule = (id: number) => {
    // Verificar se há fases associadas a este módulo
    const hasPhases = phases.some(phase => phase.moduleId === id);
    
    if (hasPhases) {
      toast({
        title: "Não é possível excluir",
        description: "Este módulo possui fases associadas. Remova as fases primeiro.",
        variant: "destructive"
      });
      return;
    }
    
    setModules(modules.filter(module => module.id !== id));
    toast({
      title: "Módulo removido",
      description: "O módulo foi removido com sucesso"
    });
  };
  
  const deletePhase = (id: number) => {
    setPhases(phases.filter(phase => phase.id !== id));
    toast({
      title: "Fase removida",
      description: "A fase foi removida com sucesso"
    });
  };
  
  const deleteEvent = (id: number) => {
    setCommunityEvents(communityEvents.filter(event => event.id !== id));
    toast({
      title: "Evento removido",
      description: "O evento foi removido com sucesso"
    });
  };

  const handleQuizEdit = (phaseId: number) => {
    const existingQuiz = quizzes.find(q => q.phaseId === phaseId);
    
    if (existingQuiz) {
      setEditingQuiz(existingQuiz);
    } else {
      // Criar um novo quiz para a fase
      const newQuiz = {
        id: quizzes.length + 1,
        phaseId,
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0
          }
        ]
      };
      setEditingQuiz(newQuiz);
    }
    
    setActiveTab("quizzes");
  };

  const handleUpdateQuiz = () => {
    if (!editingQuiz) return;
    
    const quizIndex = quizzes.findIndex(q => q.id === editingQuiz.id);
    
    if (quizIndex >= 0) {
      // Atualizar quiz existente
      const updatedQuizzes = [...quizzes];
      updatedQuizzes[quizIndex] = editingQuiz;
      setQuizzes(updatedQuizzes);
    } else {
      // Adicionar novo quiz
      setQuizzes([...quizzes, editingQuiz]);
    }
    
    setEditingQuiz(null);
    
    toast({
      title: "Quiz salvo",
      description: "O quiz foi salvo com sucesso"
    });
  };

  const addQuestion = () => {
    if (!editingQuiz) return;
    
    const newQuestion = {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0
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
          return { ...q, correctAnswer: value as number };
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
    
    const newModule = {
      id: modules.length > 0 ? Math.max(...modules.map(m => m.id)) + 1 : 1,
      name: moduleName
    };
    
    setModules([...modules, newModule]);
    
    // Reset form
    clearModuleForm();
    
    toast({
      title: "Módulo adicionado",
      description: "O módulo foi adicionado com sucesso"
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
                        const modulePhases = phases.filter(phase => phase.moduleId === module.id);
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
                                  onClick={() => deleteModule(module.id)}
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
                      id="phaseName"
                      placeholder="Ex: Fase 1 - Descobrindo habilidades"
                      value={phaseName}
                      onChange={(e) => setPhaseName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="videoUrl">URL do Vídeo (YouTube embed)</Label>
                    <Input
                      id="videoUrl"
                      placeholder="Ex: https://www.youtube.com/embed/XXXX"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Conteúdo/Texto</Label>
                    <Textarea
                      id="content"
                      placeholder="Digite o conteúdo textual da fase aqui..."
                      rows={5}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={editingPhase ? handleUpdatePhase : handleAddPhase} 
                    className="w-full bg-trilha-orange hover:bg-trilha-orange/90"
                  >
                    {editingPhase ? "Atualizar Fase" : "Adicionar Fase"}
                  </Button>

                  {editingPhase && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setEditingPhase(null);
                        setPhaseName("");
                        setVideoUrl("");
                        setContent("");
                      }}
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
                  <h2 className="text-lg font-semibold">Fases Cadastradas</h2>
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
                        <TableHead>Módulo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Vídeo</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases.map((phase) => {
                        const moduleName = modules.find(m => m.id === phase.moduleId)?.name || "";
                        
                        return (
                          <TableRow key={phase.id}>
                            <TableCell>{phase.id}</TableCell>
                            <TableCell>{moduleName}</TableCell>
                            <TableCell>{phase.name}</TableCell>
                            <TableCell>
                              {phase.videoUrl ? <Video className="h-4 w-4 text-green-500" /> : "Sem vídeo"}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPhase(phase)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleQuizEdit(phase.id)}
                                >
                                  Quiz
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => deletePhase(phase.id)}
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
        
        {/* QUIZZES TAB */}
        <TabsContent value="quizzes">
          {editingQuiz ? (
            <Card className="p-6">
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  Editar Quiz: {getPhaseNameById(editingQuiz.phaseId)}
                </h2>
                <Button 
                  variant="outline"
                  onClick={() => setEditingQuiz(null)}
                >
                  Cancelar Edição
                </Button>
              </div>
              
              {editingQuiz.questions.map((question, index) => (
                <div key={index} className="mb-8 p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Pergunta {index + 1}</h3>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      disabled={editingQuiz.questions.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`question-${index}`}>Pergunta</Label>
                      <Input
                        id={`question-${index}`}
                        value={question.question}
                        onChange={(e) => updateQuestion(index, "question", e.target.value)}
                        placeholder="Digite a pergunta aqui"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex}>
                          <Label htmlFor={`option-${index}-${optIndex}`}>
                            Opção {optIndex + 1}
                            {question.correctAnswer === optIndex && (
                              <span className="ml-2 text-green-500 text-xs">
                                (Resposta correta)
                              </span>
                            )}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id={`option-${index}-${optIndex}`}
                              value={option}
                              onChange={(e) => updateQuestion(index, `option${optIndex}`, e.target.value)}
                              placeholder={`Opção ${optIndex + 1}`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant={question.correctAnswer === optIndex ? "default" : "outline"}
                              onClick={() => updateQuestion(index, "correctAnswer", optIndex)}
                              className={question.correctAnswer === optIndex ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              ✓
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={addQuestion}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar pergunta
                </Button>
                
                <Button 
                  onClick={handleUpdateQuiz}
                  className="bg-trilha-orange hover:bg-trilha-orange/90"
                >
                  Salvar Quiz
                </Button>
              </div>
            </Card>
          ) : (
            <div>
              <Card className="p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Quizzes Cadastrados</h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar quizzes..."
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fase</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Perguntas</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((quiz) => {
                        const phase = phases.find(p => p.id === quiz.phaseId);
                        const moduleName = phase 
                          ? modules.find(m => m.id === phase.moduleId)?.name || "" 
                          : "";
                        
                        return (
                          <TableRow key={quiz.id}>
                            <TableCell>{quiz.id}</TableCell>
                            <TableCell>{phase?.name || "Fase Removida"}</TableCell>
                            <TableCell>{moduleName}</TableCell>
                            <TableCell>{quiz.questions.length}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingQuiz(quiz)}
                                >
                                  <Edit className="h-4 w-4" />
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
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Fases sem Quiz</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fase</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases
                        .filter(phase => !quizzes.some(q => q.phaseId === phase.id))
                        .map(phase => {
                          const moduleName = modules.find(m => m.id === phase.moduleId)?.name || "";
                          
                          return (
                            <TableRow key={`no-quiz-${phase.id}`}>
                              <TableCell>{phase.name}</TableCell>
                              <TableCell>{moduleName}</TableCell>
                              <TableCell>
                                <Button 
                                  size="sm"
                                  onClick={() => handleQuizEdit(phase.id)}
                                >
                                  Criar Quiz
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      }
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="eventos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="p-4 mb-6">
                <h2 className="text-lg font-semibold mb-4">Adicionar Novo Evento</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="eventTitle">Título do Evento</Label>
                    <Input
                      id="eventTitle"
                      placeholder="Ex: Workshop de Soft Skills"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventDate">Data</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="eventTime">Horário</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="eventDescription">Descrição</Label>
                    <Textarea
                      id="eventDescription"
                      placeholder="Descreva o evento aqui..."
                      rows={3}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="eventLocation">Local</Label>
                    <Input
                      id="eventLocation"
                      placeholder="Ex: Online (Zoom) ou Centro Cultural"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={handleAddEvent} className="w-full bg-trilha-orange hover:bg-trilha-orange/90">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Evento
                  </Button>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Eventos Cadastrados</h2>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar eventos..."
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {communityEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>{new Date(event.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{event.time}</TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => deleteEvent(event.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
      </Tabs>
    </div>
  );
};

export default AdminPage;
