import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { 
    getModules, 
    deleteModule, 
    Module, 
    getPhasesByModuleId, 
    deletePhase, 
    Phase 
} from "@/services/moduleService";
import { toast } from "sonner";
import * as Dialog from '@radix-ui/react-dialog';

// Ícones e Componentes
import { BarChart3, BrainCircuit, Users, Star, LogOut, Edit, Trash2, PlusCircle, FileText, Calendar, HelpCircle, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModuleForm from "@/components/ModuleForm";
import PhaseForm from "@/components/PhaseForm";

// Tipos para controle de visualização
type AdminView = 'hub' | 'modules' | 'phases' | 'quizzes' | 'events';

// --- COMPONENTES AUXILIARES ---
const AdminSkeleton = (): JSX.Element => (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-pulse bg-slate-100">
        <div className="flex justify-between items-center mb-8"><Skeleton className="h-9 w-64 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
        <div className="flex gap-2 mb-8"><Skeleton className="h-10 w-32 rounded-lg" /><Skeleton className="h-10 w-32 rounded-lg" /></div>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
            <Skeleton className="h-80 rounded-2xl" />
        </div>
    </div>
);
const StatCard = ({ title, value, icon: Icon, change }: { title: string, value: string, icon: React.ElementType, change: string }) => (
    <div className="glass-card p-6 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5">
        <div className="flex justify-between items-start"><h3 className="text-base font-semibold text-slate-700">{title}</h3><Icon className="h-6 w-6 text-slate-500" /></div>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        <p className="text-sm text-green-600 mt-1">{change}</p>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function AdminPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    const [currentView, setCurrentView] = useState<AdminView>('hub');
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<Module | null>(null);
    const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const [selectedModuleIdForPhases, setSelectedModuleIdForPhases] = useState<number | null>(null);

    const { data: modules = [], isLoading } = useQuery({ queryKey: ['adminModules'], queryFn: getModules });

    const { data: phases = [], refetch: refetchPhases } = useQuery({
        queryKey: ['adminPhases', selectedModuleIdForPhases],
        queryFn: () => selectedModuleIdForPhases ? getPhasesByModuleId(selectedModuleIdForPhases) : Promise.resolve([]),
        enabled: !!selectedModuleIdForPhases,
    });
    
    useEffect(() => {
        if (modules.length > 0 && !selectedModuleIdForPhases) {
            setSelectedModuleIdForPhases(modules[0].id);
        }
    }, [modules, selectedModuleIdForPhases]);

    const deleteModuleMutation = useMutation({
        mutationFn: deleteModule,
        onSuccess: () => { toast.success("Módulo removido!"); queryClient.invalidateQueries({ queryKey: ['adminModules'] }); },
        onError: (error) => toast.error(`Erro: ${error.message}`),
    });

    const deletePhaseMutation = useMutation({
        mutationFn: deletePhase,
        onSuccess: () => { toast.success("Fase removida!"); refetchPhases(); },
        onError: (error) => toast.error(`Erro: ${error.message}`),
    });

    const handleOpenModuleModal = (module: Module | null = null) => { setEditingModule(module); setIsModuleModalOpen(true); };
    const handleOpenPhaseModal = (phase: Phase | null = null) => {
        if (!selectedModuleIdForPhases) { toast.error("Por favor, selecione um módulo primeiro."); return; }
        setEditingPhase(phase);
        setIsPhaseModalOpen(true);
    };
    
    if (isLoading) return <AdminSkeleton />;

    const renderContent = (): JSX.Element => {
        switch (currentView) {
            case 'modules':
                return (
                    <div>
                        <Button variant="ghost" onClick={() => setCurrentView('hub')} className="mb-4 text-slate-600 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Gerenciar Módulos</CardTitle>
                                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => handleOpenModuleModal()}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Módulo</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {modules.map((module) => (
                                            <TableRow key={module.id}>
                                                <TableCell className="font-medium">{module.name}</TableCell>
                                                <TableCell className="capitalize">{module.type}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModuleModal(module)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteModuleMutation.mutate(module.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'phases':
                 return (
                    <div>
                        <Button variant="ghost" onClick={() => setCurrentView('hub')} className="mb-4 text-slate-600 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                        <Card>
                             <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <CardTitle>Gerenciar Fases</CardTitle>
                                    <Select value={selectedModuleIdForPhases?.toString()} onValueChange={(v) => setSelectedModuleIdForPhases(Number(v))}>
                                        <SelectTrigger className="w-full sm:w-[280px] bg-white"><SelectValue placeholder="Selecione um módulo..." /></SelectTrigger>
                                        <SelectContent>{modules.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <Button className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto" onClick={() => handleOpenPhaseModal()}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Fase</Button>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Nome da Fase</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {phases.map((phase) => (
                                            <TableRow key={phase.id}>
                                                <TableCell className="font-medium">{phase.name}</TableCell>
                                                <TableCell className="capitalize">{phase.type}</TableCell>
                                                <TableCell className="text-right">
                                                     <Button variant="ghost" size="icon" onClick={() => handleOpenPhaseModal(phase)}><Edit className="h-4 w-4" /></Button>
                                                     <Button variant="ghost" size="icon" onClick={() => deletePhaseMutation.mutate(phase.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'quizzes':
            case 'events':
                return (
                    <div>
                        <Button variant="ghost" onClick={() => setCurrentView('hub')} className="mb-4 text-slate-600 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                        <Card><CardHeader><CardTitle>Em Desenvolvimento</CardTitle></CardHeader><CardContent><p>A área de gerenciamento de "{currentView}" está em construção.</p></CardContent></Card>
                    </div>
                );
            case 'hub':
            default:
                return (
                     <div className="text-center">
                         <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Conteúdo</h2>
                         <p className="text-slate-600 mb-6">Aqui você pode criar, editar e remover todo o conteúdo das trilhas.</p>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Button className="py-6 text-base bg-orange-500 hover:bg-orange-600" onClick={() => setCurrentView('modules')}><Edit className="mr-2 h-5 w-5" /> Módulos</Button>
                            <Button className="py-6 text-base bg-orange-500 hover:bg-orange-600" onClick={() => setCurrentView('phases')}><FileText className="mr-2 h-5 w-5" /> Fases</Button>
                            <Button className="py-6 text-base bg-orange-500 hover:bg-orange-600" onClick={() => setCurrentView('quizzes')}><HelpCircle className="mr-2 h-5 w-5" /> Quizzes</Button>
                            <Button className="py-6 text-base bg-orange-500 hover:bg-orange-600" onClick={() => setCurrentView('events')}><Calendar className="mr-2 h-5 w-5" /> Eventos</Button>
                         </div>
                    </div>
                );
        }
    };
    
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-100">
            <style>{`.glass-card { background: rgba(255, 255, 255, 0.6); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }`}</style>
            
            <header className="flex justify-between items-center mb-8">
                <div><h1 className="text-3xl font-bold text-slate-900">Painel de Admin</h1><p className="text-slate-500 mt-1">Visão geral do desempenho.</p></div>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="bg-white/50"><LogOut className="h-4 w-4 mr-2" /> Voltar ao App</Button>
            </header>
            
            <Tabs defaultValue="conteudo" className="w-full">
                <TabsList className="mb-6 inline-flex h-auto items-center justify-center rounded-lg bg-slate-200 p-1.5 text-muted-foreground">
                    <TabsTrigger value="dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold ring-offset-background transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"><BarChart3 className="h-4 w-4 mr-2" />Dashboard</TabsTrigger>
                    <TabsTrigger value="conteudo" className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold ring-offset-background transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"><BrainCircuit className="h-4 w-4 mr-2" />Gerenciar Conteúdo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total de Usuários" value="450" icon={Users} change="+12% este mês" />
                            <StatCard title="Módulos Ativos" value={modules.length.toString()} icon={BrainCircuit} change="Total de trilhas" />
                            <StatCard title="Fases Concluídas" value="1,283" icon={Star} change="+23% este mês" />
                            <StatCard title="Engajamento" value="78%" icon={BarChart3} change="+5% este mês" />
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="conteudo">
                    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                        {renderContent()}
                    </div>
                </TabsContent>
            </Tabs>
            
            <Dialog.Root open={isModuleModalOpen} onOpenChange={setIsModuleModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-white p-0 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex-shrink-0">
                            <Dialog.Title className="text-lg font-bold text-slate-900">{editingModule ? "Editar Módulo" : "Novo Módulo"}</Dialog.Title>
                            <Dialog.Description className="text-sm text-slate-500 mt-1">Preencha as informações do módulo.</Dialog.Description>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6">
                            <ModuleForm module={editingModule || undefined} onSuccess={() => setIsModuleModalOpen(false)} />
                        </div>
                        <Dialog.Close asChild><button aria-label="Fechar" className="absolute top-4 right-4 rounded-full p-1.5 transition-colors hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button></Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
                 <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-lg bg-white p-0 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                         <div className="p-6 border-b flex-shrink-0">
                            <Dialog.Title className="text-lg font-bold">{editingPhase ? "Editar Fase" : "Nova Fase"}</Dialog.Title>
                            <Dialog.Description className="text-sm text-slate-500 mt-1">Vincule esta fase a um módulo e preencha suas informações.</Dialog.Description>
                         </div>
                         <div className="flex-grow overflow-y-auto p-6">
                            <PhaseForm 
                                moduleId={selectedModuleIdForPhases!} 
                                phase={editingPhase || undefined} 
                                onSuccess={() => setIsPhaseModalOpen(false)} 
                                onCancel={() => setIsPhaseModalOpen(false)}
                            />
                         </div>
                         <Dialog.Close asChild><button aria-label="Fechar" className="absolute top-4 right-4 rounded-full p-1.5 transition-colors hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button></Dialog.Close>
                    </Dialog.Content>
                 </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}