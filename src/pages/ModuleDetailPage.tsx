import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    getModuleById,
    getPhasesByModuleId,
    getUserPhaseStatus,
    getModuleProgress,
    Phase,
    PhaseStatus,
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import {
    PlayCircle,
    CheckCircle2,
    RefreshCw,
    ArrowLeft,
    Lock,
    Star,
    Trophy,
    BookText,
    Video,
    Award,
} from "lucide-react";
import { getProfile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TrailPhase extends Phase {
    status: PhaseStatus;
    isLocked: boolean;
    position: { x: number; y: number };
}

// Skeleton não precisa de mudanças, permanece igual.
const ModuleDetailSkeleton = () => (
    <div className="min-h-screen bg-background items-center justify-center flex animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                    <Skeleton className="h-7 w-48 bg-muted" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-muted" />
            </div>
        </header>
        <main className="container px-4 py-2 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl bg-muted" />
            <Skeleton className="h-[600px] w-full rounded-2xl bg-muted" />
        </main>
    </div>
);


// --- COMPONENTE PRINCIPAL ---
export default function ModuleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");
    
    const [hoveredPhase, setHoveredPhase] = useState<number | null>(null);
    const [pressedPhase, setPressedPhase] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleDetailData", moduleId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const [userProfile, module, phases] = await Promise.all([
                getProfile(user.id),
                getModuleById(moduleId),
                getPhasesByModuleId(moduleId),
            ]);

            if (!module) throw new Error("Módulo não encontrado.");

            const progress = await getModuleProgress(user.id, moduleId);

            const statusMap: { [key: number]: PhaseStatus } = {};
            for (const phase of phases) {
                statusMap[phase.id] = await getUserPhaseStatus(user.id, phase.id);
            }

            const trailPhases: TrailPhase[] = phases.map((phase, index) => ({
                ...phase,
                status: statusMap[phase.id],
                isLocked: index > 0 && statusMap[phases[index - 1].id] !== "completed",
                position: { x: 0, y: 0 }
            }));

            return { userProfile, module, phases: trailPhases, progress };
        },
        enabled: !!moduleId,
        retry: 1,
    });

    useEffect(() => {
        if (error) {
            toast.error("Erro ao carregar o módulo.");
            navigate("/modulos");
        }
    }, [error, navigate]);

    // MELHORIA 1: Cards alinhados verticalmente no centro.
    const generatePhasePositions = (phases: TrailPhase[]): TrailPhase[] => {
        return phases.map((phase, index) => {
            const yStep = 295; // Espaçamento vertical entre os cards
            const baseX = 50;  // Posição horizontal central (50%)
    
            return {
                ...phase,
                position: { 
                    x: baseX, // Sempre 50% para criar uma linha reta vertical
                    y: 20 + (index * yStep) 
                }
            };
        });
    };

    const getPhaseIcon = (phase: TrailPhase) => {
        if (phase.isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
        if (phase.status === "completed") return <CheckCircle2 className="h-5 w-5 text-primary-foreground" />;
        switch (phase.type) {
            case "video": return <Video className="h-5 w-5 text-primary-foreground" />;
            case "quiz": return <Star className="h-5 w-5 text-primary-foreground" />;
            case "challenge": return <Trophy className="h-5 w-5 text-primary-foreground" />;
            case "text": return <BookText className="h-5 w-5 text-primary-foreground" />;
            default: return <BookText className="h-5 w-5 text-primary-foreground" />;
        }
    };

    const getPhaseColors = (phase: TrailPhase) => {
        if (phase.isLocked) return { bg: "bg-muted/30", border: "border-muted", text: "text-muted-foreground", iconBg: "bg-muted" };
        if (phase.status === "completed") return { bg: "bg-card", border: "border-primary/30", text: "text-card-foreground", iconBg: "bg-primary" };
        return { bg: "bg-card", border: "border-primary/40", text: "text-card-foreground", iconBg: "bg-primary" };
    };

    const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
        const isCompleted = from.status === "completed";
        const fromY = from.position.y + 110; // Ajuste para começar do centro do card
        const toY = to.position.y;
        const deltaY = toY - fromY;
        const pathData = `M 0,0 v ${deltaY}`; // Linha reta vertical
        
        return (
            <div key={`connection-${index}`} className="absolute z-0" style={{ left: '50%', top: fromY, transform: 'translateX(-50%)', height: deltaY }}>
                <svg width="4" height="100%" style={{ overflow: 'visible' }}>
                    <path d={pathData} stroke={isCompleted ? "hsl(var(--primary))" : "hsl(var(--muted))"} strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
            </div>
        );
    };

    const startModule = () => {
        if (!data?.phases || data.phases.length === 0) {
            toast.error("Este módulo não possui fases disponíveis.");
            return;
        }
        const firstPhase = data.phases[0];
        navigate(`/modulo/${moduleId}/fase/${firstPhase.id}`);
    };

    const handlePhaseClick = (phase: Phase) => navigate(`/modulo/${moduleId}/fase/${phase.id}`);

    if (isLoading) return <ModuleDetailSkeleton />;
    
    if (error || !data) {
        return (
            <div className="p-4 text-center">
                <p className="text-destructive">{error?.message || "Módulo não encontrado."}</p>
                <Button onClick={() => navigate("/modulos")} className="mt-4">Voltar aos Módulos</Button>
            </div>
        );
    }

    const { userProfile, module, phases, progress } = data;
    const isModuleComplete = phases.length > 0 && phases.every((p) => p.status === "completed");
    const positionedPhases = generatePhasePositions(phases);
    
    // MELHORIA 2: Altura do contêiner aumentada para garantir espaço no final para a navegação.
    const containerHeight = Math.max(600, (positionedPhases.length - 1) * 290 + 350);

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 sm:p-6 bg-background border-b border-border z-10">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate("/modulos")} className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95 border border-border">
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-lg">{module.emoji || "📚"}</div>
                            <h1 className="text-xl font-bold text-foreground truncate">{module.name}</h1>
                        </div>
                    </div>
                    <Link to="/perfil">
                        <img src={userProfile?.avatar_url || ""} alt="Perfil" className="h-12 w-12 rounded-full border-2 border-border shadow-md" />
                    </Link>
                </div>
            </header>
            
            {/* MELHORIA 3: Layout principal usa grid para centralizar a trilha. */}
            <main className="flex-1 overflow-y-auto grid place-items-center p-4">
                {phases.length > 0 ? (
                    <div className="relative w-full max-w-md">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-border/50">
                                <Award className="h-3 w-3 text-primary" />
                                <span className="text-xs font-semibold text-primary">{phases.filter(p => p.status === "completed").length} de {phases.length} concluídas</span>
                            </div>
                        </div>
                        <div className="relative" style={{ height: containerHeight }}>
                            {positionedPhases.slice(0, -1).map((phase, index) => renderConnection(phase, positionedPhases[index + 1], index))}
                            {positionedPhases.map((phase, index) => {
                                const colors = getPhaseColors(phase);
                                const isPressed = pressedPhase === index;
                                const isHovered = hoveredPhase === index;
                                const isActive = phase.status === "inProgress";
                                
                                return (
                                    <div key={phase.id} className="absolute z-10" style={{ top: phase.position.y, left: `${phase.position.x}%`, transform: "translateX(-50%)", width: "260px" }}>
                                        <div
                                            className={cn("relative rounded-2xl transition-all duration-300 select-none", colors.bg, colors.border, "border-2", !phase.isLocked && "cursor-pointer", phase.isLocked && "opacity-60 cursor-not-allowed", !phase.isLocked && !isPressed && "shadow-lg hover:shadow-xl", !phase.isLocked && isPressed && "shadow-md transform scale-[0.98]", !phase.isLocked && isHovered && !isPressed && "transform scale-[1.02] shadow-xl", isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
                                            onClick={() => !phase.isLocked && handlePhaseClick(phase)}
                                            onMouseEnter={() => setHoveredPhase(index)} onMouseLeave={() => { setHoveredPhase(null); setPressedPhase(null); }}
                                            onMouseDown={() => !phase.isLocked && setPressedPhase(index)} onMouseUp={() => setPressedPhase(null)}
                                        >
                                            {/* MELHORIA 4: Selos posicionados sobre os cantos do card. */}
                                            <div className={cn("absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md z-20 border-2 transition-all duration-300", phase.status === "completed" ? "bg-primary text-primary-foreground border-card" : isActive ? "bg-primary text-primary-foreground border-card animate-pulse" : "bg-card text-muted-foreground border-border")}>
                                                {phase.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                            </div>
                                            {isActive && (
                                                <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full animate-ping z-10" />
                                            )}
                                            
                                            <div className="p-4 pt-5">
                                                <div className="flex justify-center mb-3">
                                                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-inner transition-all duration-300", colors.iconBg, isHovered && !phase.isLocked && "scale-110", isPressed && "scale-95")}>
                                                        {getPhaseIcon(phase)}
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-center text-card-foreground mb-2 line-clamp-2">{phase.name}</h3>
                                                <div className="flex justify-center gap-3 text-xs text-muted-foreground mb-3">
                                                    <span className="bg-muted/50 px-2 py-1 rounded-full">{phase.duration || 5}m</span>
                                                    <span className="bg-muted/50 px-2 py-1 rounded-full capitalize">{phase.type}</span>
                                                </div>
                                                {!phase.isLocked ? (
                                                    <Button className={cn("w-full", isActive && "animate-pulse")} size="lg">
                                                        {phase.status === 'completed' ? 'Revisar' : isActive ? 'Continuar' : 'Iniciar'}
                                                    </Button>
                                                ) : (
                                                    <div className="w-full py-2.5 bg-muted/50 rounded-lg text-muted-foreground font-medium text-xs text-center flex items-center justify-center gap-2">
                                                        <Lock className="h-3 w-3" /> Bloqueado
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border text-center">
                        <p className="text-muted-foreground">Este módulo ainda não possui fases disponíveis.</p>
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
}