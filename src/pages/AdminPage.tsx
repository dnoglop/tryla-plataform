// ARQUIVO: ModernAdminDashboard.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from "next-themes";

// Serviços e Tipos
import { 
    getModules, deleteModule, getPhasesByModuleId, deletePhase, 
    type Module, type Phase 
} from "@/services/moduleService";
import { 
    getDashboardStats, getTopUsers, getNewUsersChartData,
    type DashboardStats, type TopUser, type NewUsersDataPoint
} from "@/services/adminService";
import {
    getQuizzes, deleteQuiz, getQuestionsByQuizId, deleteQuestion,
    type Quiz, type Question
} from "@/services/quizService";

// Componentes UI
import { toast } from "sonner";
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AdminChart from '@/components/AdminChart';
import ModuleForm from "@/components/forms/ModuleForm";
import PhaseForm from "@/components/forms/PhaseForm";
import QuizForm from "@/components/forms/QuizForm";
import QuestionForm from "@/components/forms/QuestionForm";

// Ícones
import { 
    BarChart3, BrainCircuit, Users, Star, Edit, Trash2, PlusCircle, 
    FileText, Calendar, HelpCircle, X, Award, ShieldCheck, TrendingUp,
    Filter, Moon, Sun, Info, Eye, ArrowLeft
} from "lucide-react";

// --- TIPOS LOCAIS ---
type AdminView = 'overview' | 'modules' | 'phases' | 'quizzes' | 'events';
type TimeFilter = 'week' | 'month' | 'quarter';

// --- SUB-COMPONENTES ESTILIZADOS ---
const InfoTooltip = ({ content, id }: { content: string; id: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:bg-muted" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }} aria-label={`Informação sobre ${id}`}> <Info className="h-4 w-4" /> </Button>
            {isOpen && (<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-background border rounded-lg shadow-xl text-xs text-popover-foreground z-50 animate-in fade-in-50 slide-in-from-bottom-2"> <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border"></div> {content} </div>)}
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass, info }: { title: string; value: string | number; icon: React.ElementType; trend?: { value: number; positive: boolean }; colorClass: string; info?: string; }) => ( <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 hover:bg-card"> <div className={`absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full ${colorClass} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`}></div> <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 relative z-10"> <div className="flex items-center gap-1.5"> <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle> {info && <InfoTooltip content={info} id={`stat-${title}`} />} </div> <div className={`p-2 rounded-lg ${colorClass} shadow-lg`}> <Icon className="h-4 w-4 text-white" /> </div> </CardHeader> <CardContent className="relative z-10"> <div className="flex items-end justify-between gap-2"> <div className="text-2xl lg:text-3xl font-bold text-foreground"> {typeof value === 'number' ? value.toLocaleString('pt-BR') : value} </div> {trend && (<div className={`flex items-center text-xs font-semibold ${ trend.positive ? 'text-green-500' : 'text-red-500' }`}> <TrendingUp className={`h-3 w-3 mr-0.5 ${!trend.positive && 'rotate-180'}`} /> {trend.value}% </div>)} </div> </CardContent> </Card> );

const DashboardSkeleton = () => ( <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-background animate-pulse"> <div className="max-w-screen-xl mx-auto"> <div className="flex justify-between items-center mb-8"> <Skeleton className="h-9 w-64 rounded-lg bg-muted" /> <div className="flex items-center gap-4"> <Skeleton className="h-10 w-10 rounded-full bg-muted" /> <Skeleton className="h-10 w-24 rounded-lg bg-muted" /> </div> </div> <div className="flex gap-2 mb-8"> {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-lg bg-muted" />)} </div> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-muted" />)} </div> <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> <div className="lg:col-span-3"><Skeleton className="h-96 rounded-2xl bg-muted" /></div> <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl bg-muted" /></div> </div> </div> </div> );

// --- COMPONENTE PRINCIPAL ---
export default function ModernAdminDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { theme, setTheme } = useTheme();
    
    const [currentView, setCurrentView] = useState<AdminView>('overview');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const [selectedModuleIdForPhases, setSelectedModuleIdForPhases] = useState<number | null>(null);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedQuizForQuestions, setSelectedQuizForQuestions] = useState<Quiz | null>(null);

    const { data: modules = [], isLoading: isLoadingModules } = useQuery<Module[]>({ queryKey: ['adminModules'], queryFn: getModules });
    const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
    const { data: topUsers = [], isLoading: isLoadingTopUsers } = useQuery<TopUser[]>({ queryKey: ['topUsers'], queryFn: getTopUsers });
    const { data: newUsersData = [], isLoading: isLoadingChart } = useQuery<NewUsersDataPoint[]>({ queryKey: ['newUsersChartData', timeFilter], queryFn: () => getNewUsersChartData(timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 90), });
    const { data: phases = [], refetch: refetchPhases, isLoading: isLoadingPhases } = useQuery<Phase[]>({ queryKey: ['adminPhases', selectedModuleIdForPhases], queryFn: () => selectedModuleIdForPhases ? getPhasesByModuleId(selectedModuleIdForPhases) : Promise.resolve([]), enabled: !!selectedModuleIdForPhases, });
    const { data: quizzes = [], isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({ queryKey: ['quizzes'], queryFn: getQuizzes });
    const { data: questions = [], refetch: refetchQuestions, isLoading: isLoadingQuestions } = useQuery<Question[]>({ queryKey: ['questions', selectedQuizForQuestions?.id], queryFn: () => getQuestionsByQuizId(selectedQuizForQuestions!.id), enabled: !!selectedQuizForQuestions, });

    const deleteModuleMutation = useMutation({ mutationFn: deleteModule, onSuccess: () => { toast.success("Módulo removido!"); queryClient.invalidateQueries({ queryKey: ['adminModules'] }); }, onError: (error) => toast.error(`Erro: ${error.message}`) });
    const deletePhaseMutation = useMutation({ mutationFn: deletePhase, onSuccess: () => { toast.success("Fase removida!"); refetchPhases(); }, onError: (error) => toast.error(`Erro: ${error.message}`) });
    const deleteQuizMutation = useMutation({ mutationFn: (quiz: Quiz) => deleteQuiz(quiz.id, quiz.phase_id), onSuccess: () => { toast.success("Quiz removido!"); queryClient.invalidateQueries({ queryKey: ['quizzes'] }); }, onError: (error) => toast.error(`Erro: ${error.message}`) });
    const deleteQuestionMutation = useMutation({ mutationFn: deleteQuestion, onSuccess: () => { toast.success("Pergunta removida!"); refetchQuestions(); }, onError: (error) => toast.error(`Erro: ${error.message}`) });

    // --- EFFECTS & COMPUTED VALUES ---
    useEffect(() => { if (modules.length > 0 && !selectedModuleIdForPhases) setSelectedModuleIdForPhases(modules[0].id); }, [modules, selectedModuleIdForPhases]);
    const formattedChartData = useMemo(() => newUsersData.map(item => ({ name: new Date(item.day).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', ''), value: item.count, })), [newUsersData]);
    const growth = useMemo(() => { if (newUsersData.length < 2) return null; const totalThisPeriod = newUsersData.reduce((acc, curr) => acc + curr.count, 0); const half = Math.floor(newUsersData.length / 2); const previousPeriodTotal = newUsersData.slice(0, half).reduce((acc, curr) => acc + curr.count, 0); if (previousPeriodTotal === 0) return { value: totalThisPeriod > 0 ? 100 : 0, positive: true }; const growthValue = ((totalThisPeriod - previousPeriodTotal) / previousPeriodTotal) * 100; return { value: Math.abs(Math.round(growthValue)), positive: growthValue >= 0 }; }, [newUsersData]);

    // --- HANDLERS ---
    const handleOpenModuleModal = (module: Module | null = null) => { setEditingModule(module); setIsModuleModalOpen(true); };
    const handleOpenPhaseModal = (phase: Phase | null = null) => { if (!selectedModuleIdForPhases) { toast.error("Selecione um módulo."); return; } setEditingPhase(phase); setIsPhaseModalOpen(true); };
    const handleOpenQuizModal = (quiz: Quiz | null = null) => { setEditingQuiz(quiz); setIsQuizModalOpen(true); };
    const handleOpenQuestionModal = (question: Question | null = null) => { setEditingQuestion(question); setIsQuestionModalOpen(true); };

    const isLoading = isLoadingModules || isLoadingStats || isLoadingTopUsers || isLoadingChart;
    if (isLoading && currentView === 'overview') return <DashboardSkeleton />;

    // --- RENDER FUNCTIONS FOR EACH VIEW ---
    const renderOverview = () => ( <div className="space-y-8 animate-in fade-in-50 duration-500"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> <StatCard title="Total de Usuários" value={dashboardStats?.userCount ?? 0} icon={Users} colorClass="bg-blue-500" info="Número total de usuários registrados na plataforma." /> <StatCard title="Módulos Ativos" value={modules.length} icon={BrainCircuit} colorClass="bg-purple-500" info="Quantidade de módulos de aprendizado disponíveis para os usuários." /> <StatCard title="Fases Concluídas" value={dashboardStats?.completedPhasesCount ?? 0} icon={Star} colorClass="bg-green-500" info="Total de fases (lições) que foram completadas por todos os usuários." /> <StatCard title="Desafios Completos" value={dashboardStats?.completedChallengesCount ?? 0} icon={ShieldCheck} colorClass="bg-primary" trend={growth || undefined} info="Número de desafios diários completados no período selecionado." /> </div> <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> <Card className="lg:col-span-3 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg"> <CardHeader className="flex flex-row items-center justify-between"> <div className="flex items-center gap-2"> <CardTitle className="text-lg font-semibold">Evolução de Usuários</CardTitle> <InfoTooltip content="Gráfico mostrando a quantidade de novos usuários cadastrados a cada dia no período selecionado." id="chart-info" /> </div> <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}> <SelectTrigger className="w-auto gap-2 bg-background border-border/80"> <Filter className="h-4 w-4 text-muted-foreground" /> <SelectValue /> </SelectTrigger> <SelectContent> <SelectItem value="week">Últimos 7 dias</SelectItem> <SelectItem value="month">Últimos 30 dias</SelectItem> <SelectItem value="quarter">Últimos 90 dias</SelectItem> </SelectContent> </Select> </CardHeader> <CardContent className="h-80 pr-4"> <AdminChart data={formattedChartData} title="" color="hsl(var(--primary))" /> </CardContent> </Card> <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg h-fit"> <CardHeader> <div className="flex items-center gap-2"> <CardTitle className="flex items-center text-lg font-semibold"> <Award className="mr-2 h-5 w-5 text-amber-400" /> Ranking de Usuários </CardTitle> <InfoTooltip content="Os 5 usuários com a maior pontuação de experiência (XP) na plataforma." id="ranking-info" /> </div> </CardHeader> <CardContent className="space-y-3"> {topUsers.map((user, index) => ( <div key={user.full_name + index} className="flex items-center gap-4 p-2 rounded-xl transition-all hover:bg-muted"> <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-background ${ index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-400' : 'bg-muted-foreground/50' }`}> {index + 1} </div> <Avatar className="h-10 w-10 border-2 border-primary/50"> <AvatarImage src={user.avatar_url ?? ''} alt={user.full_name ?? ''} /> <AvatarFallback className="bg-primary/20 text-primary font-semibold">{user.full_name?.charAt(0)}</AvatarFallback> </Avatar> <div className="flex-grow min-w-0"> <p className="font-semibold text-foreground truncate">{user.full_name}</p> <p className="text-sm font-bold text-primary">{user.xp?.toLocaleString('pt-BR')} XP</p> </div> </div> ))} </CardContent> </Card> </div> </div> );
    const renderModules = () => ( <div className="space-y-6 animate-in fade-in-50 duration-500"> <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> <div> <h2 className="text-2xl font-bold">Gerenciar Módulos</h2> <p className="text-muted-foreground mt-1">Crie, edite e organize as trilhas de aprendizado.</p> </div> <Button onClick={() => handleOpenModuleModal()}> <PlusCircle className="mr-2 h-4 w-4" /> Novo Módulo </Button> </div> <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg"> <Table> <TableHeader> <TableRow> <TableHead>Módulo</TableHead> <TableHead>Tipo</TableHead> <TableHead>Ordem</TableHead> <TableHead className="text-right">Ações</TableHead> </TableRow> </TableHeader> <TableBody> {modules.map((module) => ( <TableRow key={module.id}> <TableCell className="font-medium"> <div className="flex items-center gap-3"> <span className="text-2xl">{module.emoji || '📚'}</span> <span className="font-semibold">{module.name}</span> </div> </TableCell> <TableCell><Badge variant="outline" className="capitalize">{module.type}</Badge></TableCell> <TableCell>{module.order_index}</TableCell> <TableCell className="text-right space-x-1"> <Button variant="ghost" size="icon" onClick={() => handleOpenModuleModal(module)}><Edit className="h-4 w-4 text-muted-foreground" /></Button> <Button variant="ghost" size="icon" onClick={() => deleteModuleMutation.mutate(module.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button> </TableCell> </TableRow> ))} </TableBody> </Table> </Card> </div> );
    const renderPhases = () => ( <div className="space-y-6 animate-in fade-in-50 duration-500"> <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> <div> <h2 className="text-2xl font-bold">Gerenciar Fases</h2> <p className="text-muted-foreground mt-1">Adicione e edite as lições de cada módulo.</p> </div> <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"> <Select value={selectedModuleIdForPhases?.toString()} onValueChange={(v) => setSelectedModuleIdForPhases(Number(v))}> <SelectTrigger className="sm:w-[280px]"> <SelectValue placeholder="Selecione um módulo..." /> </SelectTrigger> <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent> </Select> <Button onClick={() => handleOpenPhaseModal()}> <PlusCircle className="mr-2 h-4 w-4" /> Nova Fase </Button> </div> </div> <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg"> <Table> <TableHeader> <TableRow> <TableHead>Fase</TableHead> <TableHead>Tipo</TableHead> <TableHead>Ordem</TableHead> <TableHead className="text-right">Ações</TableHead> </TableRow> </TableHeader> <TableBody> {isLoadingPhases && [...Array(3)].map((_, i) => ( <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full bg-muted" /></TableCell></TableRow> ))} {!isLoadingPhases && phases.map((phase) => ( <TableRow key={phase.id}> <TableCell className="font-medium">{phase.name}</TableCell> <TableCell><Badge variant="outline" className="capitalize">{phase.type}</Badge></TableCell> <TableCell>{phase.order_index}</TableCell> <TableCell className="text-right space-x-1"> <Button variant="ghost" size="icon" onClick={() => handleOpenPhaseModal(phase)}><Edit className="h-4 w-4 text-muted-foreground" /></Button> <Button variant="ghost" size="icon" onClick={() => deletePhaseMutation.mutate(phase.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button> </TableCell> </TableRow> ))} {!isLoadingPhases && phases.length === 0 && ( <TableRow> <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma fase encontrada para este módulo.</TableCell> </TableRow> )} </TableBody> </Table> </Card> </div> );
    const renderQuizList = () => ( <div className="space-y-6 animate-in fade-in-50 duration-500"> <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> <div> <h2 className="text-2xl font-bold">Gerenciar Quizzes</h2> <p className="text-muted-foreground mt-1">Crie e edite os quizzes da plataforma.</p> </div> <Button onClick={() => setCurrentView('phases')}> <PlusCircle className="mr-2 h-4 w-4" /> Novo Quiz </Button> </div> <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg"> <Table> <TableHeader><TableRow><TableHead>Nome do Quiz</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader> <TableBody> {isLoadingQuizzes && [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-8 w-full bg-muted" /></TableCell></TableRow>)} {!isLoadingQuizzes && quizzes.map((quiz) => ( <TableRow key={quiz.id}> <TableCell className="font-semibold">{quiz.name}</TableCell> <TableCell className="text-muted-foreground">{quiz.description}</TableCell> <TableCell className="text-right space-x-1"> <Button variant="outline" size="sm" onClick={() => setSelectedQuizForQuestions(quiz)}>Gerenciar Perguntas</Button> <Button variant="ghost" size="icon" onClick={() => handleOpenQuizModal(quiz)}><Edit className="h-4 w-4 text-muted-foreground" /></Button> <Button variant="ghost" size="icon" onClick={() => deleteQuizMutation.mutate(quiz)}><Trash2 className="h-4 w-4 text-destructive" /></Button> </TableCell> </TableRow> ))} {!isLoadingQuizzes && quizzes.length === 0 && ( <TableRow> <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum quiz encontrado.</TableCell> </TableRow> )} </TableBody> </Table> </Card> </div> );
    const renderQuestionsManagement = () => ( <div className="space-y-6 animate-in fade-in-50 duration-500"> <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> <div> <Button variant="outline" onClick={() => setSelectedQuizForQuestions(null)} className="mb-2"> <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Quizzes </Button> <h2 className="text-2xl font-bold">Perguntas de: <span className="text-primary">{selectedQuizForQuestions?.name}</span></h2> <p className="text-muted-foreground mt-1">Adicione e edite as perguntas para este quiz.</p> </div> <Button onClick={() => handleOpenQuestionModal(null)}> <PlusCircle className="mr-2 h-4 w-4" /> Nova Pergunta </Button> </div> <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg"> <Table> <TableHeader><TableRow><TableHead>Pergunta</TableHead><TableHead>Resposta Correta</TableHead><TableHead>Dica</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader> <TableBody> {isLoadingQuestions && [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full bg-muted" /></TableCell></TableRow>)} {!isLoadingQuestions && questions.map((q) => ( <TableRow key={q.id}> <TableCell className="font-medium max-w-sm truncate">{q.question}</TableCell> <TableCell><Badge variant="secondary">{q.options[q.correct_answer]}</Badge></TableCell> <TableCell className="text-muted-foreground max-w-xs truncate">{q.tips_question}</TableCell> <TableCell className="text-right space-x-1"> <Button variant="ghost" size="icon" onClick={() => handleOpenQuestionModal(q)}><Edit className="h-4 w-4 text-muted-foreground" /></Button> <Button variant="ghost" size="icon" onClick={() => deleteQuestionMutation.mutate(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button> </TableCell> </TableRow> ))} {!isLoadingQuestions && questions.length === 0 && ( <TableRow> <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma pergunta encontrada para este quiz.</TableCell> </TableRow> )} </TableBody> </Table> </Card> </div> );
    const renderQuizzes = () => selectedQuizForQuestions ? renderQuestionsManagement() : renderQuizList();
    const renderPlaceholder = (title: string) => ( <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-card/50 backdrop-blur-sm border-border/50 shadow-lg rounded-2xl animate-in fade-in-50 duration-500"> <div className="p-4 bg-primary/10 rounded-full mb-4"> <Calendar className="h-10 w-10 text-primary" /> </div> <h2 className="text-2xl font-bold">Gerenciar {title}</h2> <p className="text-muted-foreground mt-2 max-w-md">Esta área está em desenvolvimento. Em breve, você poderá criar e editar {title.toLowerCase()} diretamente por aqui.</p> </div> );

    const renderContent = () => {
        switch (currentView) {
            case 'overview': return renderOverview();
            case 'modules': return renderModules();
            case 'phases': return renderPhases();
            case 'quizzes': return renderQuizzes();
            case 'events': return renderPlaceholder('Eventos');
            default: return renderOverview();
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-background text-foreground">
            <div className="max-w-screen-xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Painel de Controle</h1>
                        <p className="text-muted-foreground">Os principais indicadores e todos os módulos da plataforma estão aqui.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate("/inicio")}>
                            <Eye className="h-4 w-4 mr-2" /> Voltar ao App
                        </Button>
                    </div>
                </header>

                <nav className="flex flex-wrap gap-2 mb-8">
                    {[ { id: 'overview', label: 'Visão Geral', icon: BarChart3 }, { id: 'modules', label: 'Módulos', icon: BrainCircuit }, { id: 'phases', label: 'Fases', icon: FileText }, { id: 'quizzes', label: 'Quizzes', icon: HelpCircle }, { id: 'events', label: 'Eventos', icon: Calendar } ].map((item) => ( <Button key={item.id} variant={currentView === item.id ? "default" : "outline"} className={`transition-all duration-200 ${currentView === item.id && 'shadow-lg'}`} onClick={() => setCurrentView(item.id as AdminView)}> <item.icon className="h-4 w-4 mr-2" /> {item.label} </Button> ))}
                </nav>

                <main>
                    {renderContent()}
                </main>
            </div>
            
            <Dialog.Root open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-card p-6 rounded-2xl shadow-xl z-50 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
                        <Dialog.Title className="text-lg font-bold text-foreground">{editingModule ? "Editar Módulo" : "Novo Módulo"}</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground mt-1">Preencha as informações do módulo de aprendizado.</Dialog.Description>
                        <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground"><X className="h-5 w-5" /></Button></Dialog.Close>
                        <div className="mt-6 flex-grow overflow-y-auto -mr-4 pr-4">
                           <ModuleForm module={editingModule || undefined} onSuccess={() => setIsModuleModalOpen(false)} />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
                 <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-card p-6 rounded-2xl shadow-xl z-50 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
                         <Dialog.Title className="text-lg font-bold text-foreground">{editingPhase ? "Editar Fase" : "Nova Fase"}</Dialog.Title>
                         <Dialog.Description className="text-sm text-muted-foreground mt-1">Preencha os detalhes e o conteúdo desta lição.</Dialog.Description>
                         <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground"><X className="h-5 w-5" /></Button></Dialog.Close>
                         <div className="mt-6 flex-grow overflow-y-auto -mr-4 pr-4">
                            {selectedModuleIdForPhases && (
                                <PhaseForm 
                                    moduleId={selectedModuleIdForPhases} 
                                    phase={editingPhase || undefined} 
                                    onSuccess={() => setIsPhaseModalOpen(false)} 
                                    onCancel={() => setIsPhaseModalOpen(false)}
                                />
                            )}
                         </div>
                    </Dialog.Content>
                 </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-card p-6 rounded-2xl shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                        <Dialog.Title className="text-lg font-bold">{editingQuiz ? "Editar Quiz" : "Novo Quiz"}</Dialog.Title>
                        <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground"><X className="h-5 w-5" /></Button></Dialog.Close>
                        <div className="mt-6">
                           <QuizForm quiz={editingQuiz || undefined} onSuccess={() => setIsQuizModalOpen(false)} />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in-0" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-2xl bg-card p-6 rounded-2xl shadow-xl z-50 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95">
                        <Dialog.Title className="text-lg font-bold">{editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}</Dialog.Title>
                        <Dialog.Description className="text-sm text-muted-foreground mt-1">Para o quiz: {selectedQuizForQuestions?.name}</Dialog.Description>
                        <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute top-3 right-3 rounded-full text-muted-foreground"><X className="h-5 w-5" /></Button></Dialog.Close>
                        <div className="mt-6 flex-grow overflow-y-auto -mr-4 pr-4">
                           {selectedQuizForQuestions && (
                               <QuestionForm quiz={selectedQuizForQuestions} question={editingQuestion || undefined} onSuccess={() => setIsQuestionModalOpen(false)} />
                           )}
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}