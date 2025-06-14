
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
} from "lucide-react";
import { getProfile, Profile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TrailVisualization } from "@/components/trail/TrailVisualization";

interface TrailPhase extends Phase {
    status: PhaseStatus;
    isLocked: boolean;
    position: { x: number; y: number };
}

const ModuleDetailSkeleton = () => (
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
            <Skeleton className="h-[600px] w-full rounded-2xl bg-muted" />
        </main>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function ModuleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");

    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleDetailData", moduleId],
        queryFn: async () => {
            console.log("Fetching module detail data for module:", moduleId);
            
            const {
                data: { user },
            } = await supabase.auth.getUser();
            
            if (!user) {
                console.error("No authenticated user found");
                navigate("/login");
                throw new Error("Usuário não autenticado.");
            }

            console.log("User authenticated:", user.id);

            try {
                const [userProfile, module, allModules, phases] = await Promise.all([
                    getProfile(user.id),
                    getModuleById(moduleId),
                    getModules(),
                    getPhasesByModuleId(moduleId),
                ]);

                console.log("Fetched data:", { userProfile, module, allModules, phases });

                if (!module) {
                    console.error("Module not found:", moduleId);
                    throw new Error("Módulo não encontrado.");
                }

                const progress = await getModuleProgress(user.id, moduleId);
                console.log("Module progress:", progress);

                const statusMap: { [key: number]: PhaseStatus } = {};
                for (const phase of phases) {
                    statusMap[phase.id] = await getUserPhaseStatus(user.id, phase.id);
                }

                console.log("Phase status map:", statusMap);

                const completedModulesMap: { [key: number]: boolean } = {};
                for (const m of allModules) {
                    completedModulesMap[m.id] = await isModuleCompleted(user.id, m.id);
                }

                // Converter phases para TrailPhase
                const trailPhases: TrailPhase[] = phases.map((phase, index) => ({
                    ...phase,
                    status: statusMap[phase.id],
                    isLocked: index > 0 && statusMap[phases[index - 1].id] !== "completed",
                    position: { x: 0, y: 0 } // Será calculado no componente TrailVisualization
                }));

                return {
                    userProfile,
                    module,
                    allModules,
                    phases: trailPhases,
                    progress,
                    completedModulesMap,
                };
            } catch (err) {
                console.error("Error fetching module data:", err);
                throw err;
            }
        },
        enabled: !!moduleId,
        retry: 1,
    });

    useEffect(() => {
        if (error) {
            console.error("Query error:", error);
            toast.error("Erro ao carregar o módulo.");
            navigate("/modulos");
        }
    }, [error, navigate]);

    const startModule = () => {
        if (!data?.phases || data.phases.length === 0) {
            console.log("No phases available for this module");
            toast.error("Este módulo não possui fases disponíveis.");
            return;
        }
        const firstPhase = data.phases[0];
        console.log("Starting module, navigating to first phase:", firstPhase.id);
        navigate(`/modulo/${moduleId}/fase/${firstPhase.id}`);
    };

    const handlePhaseClick = (phase: Phase) => {
        console.log("Phase clicked:", phase.id);
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    if (isLoading) return <ModuleDetailSkeleton />;
    
    if (error) {
        console.error("Component error:", error);
        return (
            <div className="p-4 text-center">
                <p className="text-destructive">Erro ao carregar módulo: {error.message}</p>
                <Button onClick={() => navigate("/modulos")} className="mt-4">
                    Voltar aos Módulos
                </Button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 text-center">
                <p>Módulo não encontrado.</p>
                <Button onClick={() => navigate("/modulos")} className="mt-4">
                    Voltar aos Módulos
                </Button>
            </div>
        );
    }

    const { userProfile, module, phases, progress } = data;
    const isModuleComplete =
        phases.length > 0 &&
        phases.every((p) => p.status === "completed");

    console.log("Rendering module detail page with phases:", phases.length);

    return (
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
                {/* Module Info Card */}
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

                {/* Trail Visualization */}
                {phases.length > 0 ? (
                    <TrailVisualization
                        phases={phases}
                        onPhaseClick={handlePhaseClick}
                        moduleProgress={progress}
                        className="min-h-[600px]"
                    />
                ) : (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border text-center">
                        <p className="text-muted-foreground">
                            Este módulo ainda não possui fases disponíveis.
                        </p>
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
}
