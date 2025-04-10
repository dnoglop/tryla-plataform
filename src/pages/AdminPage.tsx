
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Edit, FilePlus, PlusCircle, Trash2, Video } from "lucide-react";

const AdminPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("conteudo");
  
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
  
  return (
    <div className="container px-4 py-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center text-trilha-orange">Painel de Administração</h1>
      
      <Tabs defaultValue="conteudo" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="conteudo" className="flex-1"><FilePlus className="mr-2 h-4 w-4" /> Conteúdos</TabsTrigger>
          <TabsTrigger value="eventos" className="flex-1"><Calendar className="mr-2 h-4 w-4" /> Eventos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conteudo">
          <div className="card-trilha p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Adicionar Nova Fase</h2>
            
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
              
              <Button onClick={handleAddPhase} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fase
              </Button>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Fases Cadastradas</h2>
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
                          {phase.videoUrl ? <Video className="h-4 w-4" /> : "Sem vídeo"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deletePhase(phase.id)}>
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
          </div>
        </TabsContent>
        
        <TabsContent value="eventos">
          <div className="card-trilha p-4 mb-6">
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
              
              <Button onClick={handleAddEvent} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Evento
              </Button>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Eventos Cadastrados</h2>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
