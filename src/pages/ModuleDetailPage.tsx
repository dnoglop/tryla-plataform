
// src/pages/ModuleDetailPage.tsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    getModuleById,
    getPhasesByModuleId,
    getUserPhaseStatus,
    getModuleProgress,
    getModules,
    isModuleCompleted,
    Phase,
    PhaseStatus,
    Module,
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import {
    PlayCircle,
    CheckCircle2,
    RefreshCw,
    ArrowLeft,
    Lock,
    Video,
    FileText,
    HelpCircle,
    Star,
} from "lucide-react";
import { getProfile, Profile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// --- COMPONENTES AUXILIARES ---
const PhaseCard = ({
    phase,
    status,
    isLocked,
    onClick,
}: {
    phase: Phase;
    status: PhaseStatus;
    isLocked: boolean;
    onClick: () => void;
}) => {
    const isCompleted = status === "completed";
    const getPhaseTypeInPortuguese = (type: string | null): string => {
        switch (type) {
            case "video": return "Vídeo";
            case "text": return "Leitura";
            case "quiz": return "Quiz";
            case "challenge": return "Desafio";
            default: return "Conteúdo";
        }
    };

    const getIcon = () => {
        if (isLocked) return <Lock className="h-5 w-5 text-muted-foreground" />;
        if (isCompleted)
            return <CheckCircle2 className="h-5 w-5 text-green-600" />;

        // MUDANÇA: Ícones de fase usam a cor primária
        const iconClass = "h-5 w-5 text-primary";
        switch (phase.type) {
            case "video":
                return <Video className={iconClass} />;
            case "text":
                return <FileText className={iconClass} />;
            case "quiz":
                return <HelpCircle className={iconClass} />;
            case "challenge":
                return <Star className={iconClass} />;
            default:
                return <PlayCircle className={iconClass} />;
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            // MUDANÇA: Cores do card adaptadas para o tema
            className="w-full flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm hover:bg-muted/50 transition-colors disabled:bg-muted disabled:cursor-not-allowed group"
        >
            {/* MUDANÇA: Cores do círculo do ícone adaptadas para o tema */}
            <div
                className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full transition-colors ${isLocked ? "bg-muted-foreground/20" : isCompleted ? "bg-green-500/10" : "bg-primary/10"}`}
            >
                {getIcon()}
            </div>
            <div
                className={`flex-1 text-left transition-opacity ${isLocked ? "opacity-50" : ""}`}
            >
                <p className="font-semibold text-card-foreground">
                    {phase.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                    {phase.duration || 5} min •{" "}
                    {getPhaseTypeInPortuguese(phase.type)}
                </p>
            </div>
        </button>
    );
};

const ModuleDetailSkeleton = () => (
    // MUDANÇA: Cores do skeleton adaptadas para o tema
    <div className="min-h-screen bg-background animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                    <Skeleton className="h-7 w-48 bg-muted" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-muted" />
            </div>
        </header>
        <main className="container px-4 py-2 space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl bg-muted" />
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl bg-muted" />
                <Skeleton className="h-16 w-full rounded-xl bg-muted" />
                <Skeleton className="h-16 w-full rounded-xl bg-muted" />
            </div>
        </main>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function ModuleDetailPage() {
    // ... (lógica do componente permanece a mesma)
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");

    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleDetailData", moduleId],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                navigate("/login");
                throw new Error("Usuário não autenticado.");
            }
            const [userProfile, module, allModules, phases] = await Promise.all(
                [
                    getProfile(user.id),
                    getModuleById(moduleId),
                    getModules(),
                    getPhasesByModuleId(moduleId),
                ],
            );
            if (!module) throw new Error("Módulo não encontrado.");
            const progress = await getModuleProgress(user.id, moduleId);
            const statusMap: { [key: number]: PhaseStatus } = {};
            for (const phase of phases) {
                statusMap[phase.id] = await getUserPhaseStatus(
                    user.id,
                    phase.id,
                );
            }
            const completedModulesMap: { [key: number]: boolean } = {};
            for (const m of allModules) {
                completedModulesMap[m.id] = await isModuleCompleted(
                    user.id,
                    m.id,
                );
            }
            return {
                userProfile,
                module,
                allModules,
                phases,
                progress,
                statusMap,
                completedModulesMap,
            };
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

    const isPhaseLocked = (phaseIndex: number): boolean => {
        if (phaseIndex === 0) return false;
        const prevPhase = data?.phases[phaseIndex - 1];
        if (!prevPhase) return true;
        return data?.statusMap[prevPhase.id] !== "completed";
    };

    const startModule = () => {
        if (!data?.phases || data.phases.length === 0) return;
        const firstPhase = data.phases[0];
        navigate(`/modulo/${moduleId}/fase/${firstPhase.id}`);
    };

    const handlePhaseClick = (phase: Phase, phaseIndex: number) => {
        if (isPhaseLocked(phaseIndex)) {
            toast.error("Complete a fase anterior para desbloquear esta.");
            return;
        }
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    if (isLoading) return <ModuleDetailSkeleton />;
    if (!data)
        return <div className="p-4 text-center">Módulo não encontrado.</div>;

    const { userProfile, module, phases, progress, statusMap } = data;
    const isModuleComplete =
        phases.length > 0 &&
        phases.every((p) => statusMap[p.id] === "completed");

    return (
        // MUDANÇA: Cores de fundo adaptadas para o tema
        <div className="pb-24 min-h-screen bg-background">
            <header className="p-4 sm:p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/modulos")}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <h1 className="text-xl font-bold text-foreground truncate">
                            {module.name}
                        </h1>
                    </div>
                    <Link to="/perfil">
                        <img
                            src={userProfile?.avatar_url || ""}
                            alt="Perfil"
                            className="h-12 w-12 rounded-full border-2 border-background shadow-md"
                        />
                    </Link>
                </div>
            </header>

            <main className="container px-4 py-2 space-y-6">
                {/* MUDANÇA: Cores do card principal adaptadas para o tema */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                            {module.emoji || "📚"}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-card-foreground">
                                {module.name}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {module.description}
                            </p>
                        </div>
                    </div>
                    <Progress
                        value={progress}
                        className="h-3 bg-muted [&>*]:bg-primary"
                    />
                    <Button
                        onClick={startModule}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
                    >
                        {isModuleComplete ? (
                            <RefreshCw className="mr-2 h-5 w-5" />
                        ) : (
                            <PlayCircle className="mr-2 h-5 w-5" />
                        )}
                        {isModuleComplete
                            ? "Revisar Módulo"
                            : progress > 0
                              ? "Continuar Módulo"
                              : "Iniciar Módulo"}
                    </Button>
                </div>

                {phases.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-foreground">
                            Fases da Trilha
                        </h2>
                        {phases.map((phase, index) => (
                            <PhaseCard
                                key={phase.id}
                                phase={phase}
                                status={statusMap[phase.id]}
                                isLocked={isPhaseLocked(index)}
                                onClick={() => handlePhaseClick(phase, index)}
                            />
                        ))}
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
}
