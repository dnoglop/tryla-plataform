
import React, { useState, useEffect } from "react";
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
    Module,
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, List } from "lucide-react";
import { getProfile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { TrailVisualization } from "@/components/trail/TrailVisualization";

interface TrailPhase extends Phase {
    status: PhaseStatus;
    isLocked: boolean;
    position: { x: number; y: number };
}

const ModuleTrailSkeleton = () => (
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
        <main className="container px-4 py-2">
            <Skeleton className="h-[600px] w-full rounded-2xl bg-muted" />
        </main>
    </div>
);

export default function ModuleTrailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");
    const [viewMode, setViewMode] = useState<"trail" | "list">("trail");

    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleTrailData", moduleId],
        queryFn: async () => {
            console.log("Fetching module trail data for module:", moduleId);
            
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
                const [userProfile, module, phases] = await Promise.all([
                    getProfile(user.id),
                    getModuleById(moduleId),
                    getPhasesByModuleId(moduleId),
                ]);

                console.log("Fetched data:", { userProfile, module, phases });

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
                    phases: trailPhases,
                    progress,
                };
            } catch (err) {
                console.error("Error fetching module trail data:", err);
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

    const handlePhaseClick = (phase: Phase) => {
        console.log("Phase clicked:", phase.id);
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    const toggleViewMode = () => {
        setViewMode(prev => prev === "trail" ? "list" : "trail");
    };

    if (isLoading) return <ModuleTrailSkeleton />;
    
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

    console.log("Rendering module trail page with phases:", phases.length);

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
                        <div>
                            <h1 className="text-xl font-bold text-foreground truncate">
                                {module.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Visualização da Trilha
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={toggleViewMode}
                            size="sm"
                            variant="outline"
                            className="h-10 w-10 p-0"
                        >
                            {viewMode === "trail" ? <List className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                        </Button>
                        <Link to="/perfil">
                            <img
                                src={userProfile?.avatar_url || ""}
                                alt="Perfil"
                                className="h-12 w-12 rounded-full border-2 border-background shadow-md"
                            />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container px-4 py-2">
                {viewMode === "trail" ? (
                    <TrailVisualization
                        phases={phases}
                        onPhaseClick={handlePhaseClick}
                        moduleProgress={progress}
                    />
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold text-foreground">
                            Fases da Trilha
                        </h2>
                        {phases.map((phase, index) => (
                            <button
                                key={phase.id}
                                onClick={() => !phase.isLocked && handlePhaseClick(phase)}
                                disabled={phase.isLocked}
                                className="w-full flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm hover:bg-muted/50 transition-colors disabled:bg-muted disabled:cursor-not-allowed group"
                            >
                                <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ${
                                    phase.isLocked ? "bg-muted-foreground/20" : 
                                    phase.status === "completed" ? "bg-green-500/10" : "bg-primary/10"
                                }`}>
                                    {phase.status === "completed" ? "✓" : index + 1}
                                </div>
                                <div className={`flex-1 text-left ${phase.isLocked ? "opacity-50" : ""}`}>
                                    <p className="font-semibold text-card-foreground">
                                        {phase.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {phase.duration || 5} min • {phase.type}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
}
