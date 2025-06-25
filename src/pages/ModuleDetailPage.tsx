// ARQUIVO: src/pages/ModuleDetailPage.tsx (VERSÃO FINAL COMPLETA COM LAYOUT RESPONSIVO + MARCADORES)

import React, { useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getModuleById, getPhasesByModuleId, getUserPhaseStatus, Phase, PhaseStatus, Profile } from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award } from "lucide-react";
import { getProfile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useScroll, useTransform } from "framer-motion";
import { MilestoneCard, MilestoneVariant } from "@/components/journey/MilestoneCard";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface TrailPhase extends Phase {
    status: PhaseStatus;
    isLocked: boolean;
    position: { x: number; y: number };
}

// SKELETON
const ModuleDetailSkeleton = () => (
    <div className="min-h-screen bg-background items-center justify-center flex animate-pulse">
        <header className="p-4 sm:p-6 w-full">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                    <Skeleton className="h-7 w-48 bg-muted" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-muted" />
            </div>
        </header>
        <main className="container px-4 py-8 space-y-4 w-full">
            <Skeleton className="h-12 w-full rounded-xl bg-muted" />
            <Skeleton className="h-24 w-full rounded-2xl bg-muted" />
            <Skeleton className="h-24 w-full rounded-2xl bg-muted" />
            <Skeleton className="h-24 w-full rounded-2xl bg-muted" />
        </main>
    </div>
);

// COMPONENTE DA LINHA DE CONEXÃO COM MARCADOR
const ConnectionLine = ({ isActive }: { isActive: boolean }) => (
    <div className="flex-shrink-0 h-12 w-1.5 bg-muted rounded-full relative overflow-hidden my-1">
        <motion.div
            className="absolute bottom-0 left-0 w-full bg-primary"
            initial={{ height: 0 }}
            animate={{ height: isActive ? "100%" : "0%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {/* A bolinha fica visível o tempo todo, mas muda de cor implicitamente com a linha */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted border-2 border-background"></div>
        <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        />
    </div>
);

// COMPONENTE PRINCIPAL
export default function ModuleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");

    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleDetailData", moduleId],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Protagonista não autenticado.");

            const [userProfile, module, phases] = await Promise.all([
                getProfile(user.id),
                getModuleById(moduleId),
                getPhasesByModuleId(moduleId),
            ]);

            if (!module) throw new Error("Reino não encontrado.");

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
            return { userProfile, module, phases: trailPhases };
        },
        enabled: !!moduleId,
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: scrollContainerRef });
    const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

    const generatePhasePositions = (phases: TrailPhase[]): TrailPhase[] => {
        return phases.map((phase, index) => ({
            ...phase,
            position: { x: 0, y: 80 + (index * 150) } 
        }));
    };

    const renderConnection = (from: TrailPhase, to: TrailPhase, index: number) => {
        const isPathActive = from.status === "completed";
        const fromY = from.position.y + 5; 
        const toY = to.position.y;
        const deltaY = toY - fromY;
        const pathData = `M 2,0 V ${deltaY}`;

        return (
            <div 
              key={`connection-${index}`} 
              className="absolute z-0 left-6 sm:left-1/2"
              style={{ top: fromY, height: deltaY }}
            >
                <svg width="4" height="100%" style={{ overflow: "visible" }}>
                    <motion.circle 
                        cx="2" 
                        cy={deltaY} 
                        r="5" 
                        className={isPathActive ? "fill-primary" : "fill-muted"}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    />
                    <path d={pathData} stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
                    <motion.path
                        d={pathData}
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isPathActive ? 1 : 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                </svg>
            </div>
        );
    };

    const handlePhaseClick = (phase: TrailPhase) => {
        if (phase.isLocked) return;
        confetti({ particleCount: 50, spread: 50 });
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    if (isLoading) return <ModuleDetailSkeleton />;
    if (error || !data) return (
        <div className="flex items-center justify-center h-screen"><p className="text-destructive">{error?.message || "Reino não encontrado."}</p></div>
    );

    const { userProfile, module, phases } = data;
    const positionedPhases = generatePhasePositions(phases);
    const containerHeight = Math.max(800, (positionedPhases.length) * 160 + 80);

    const getMilestoneVariant = (phase: TrailPhase, isActive: boolean): MilestoneVariant => {
        if (phase.status === 'completed') return 'completed';
        if (isActive) return 'active';
        if (phase.isLocked) return 'locked';
        return 'default';
    };

    return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">
            <motion.div className="absolute top-0 left-0 w-full h-[110%] bg-cover bg-center z-0 animated-gradient-bg" style={{ y: parallaxY, opacity: 0.5 }} />

            <header className="sticky top-0 p-4 bg-background/80 backdrop-blur-lg border-b border-border z-30">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => navigate("/modulos")}>
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-lg">{module.emoji || "📚"}</div>
                        <h1 className="text-base sm:text-xl font-bold text-foreground truncate">Jornada por "{module.name}"</h1>
                    </div>
                    <Link to="/perfil">
                        <img src={userProfile?.avatar_url || ""} alt="Perfil" className="h-12 w-12 rounded-full border-2 border-border shadow-md" />
                    </Link>
                </div>
            </header>

            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 relative z-10">
                <div className="relative w-full max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border/50">
                            <Award className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">{phases.filter(p => p.status === "completed").length} de {phases.length} missões concluídas</span>
                        </div>
                    </div>

                    <div className="relative" style={{ height: containerHeight }}>
                        {positionedPhases.slice(0, -1).map((phase, index) =>
                            renderConnection(phase, positionedPhases[index + 1], index)
                        )}

                        {positionedPhases.map((phase, index) => {
                            const isActive = phase.status === "inProgress" || (phase.status === "notStarted" && !phase.isLocked);
                            const variant = getMilestoneVariant(phase, isActive);
                            return (
                                <div 
                                  key={phase.id} 
                                  className={cn(
                                      "absolute",
                                      "left-[3rem] right-0", 
                                      "sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[380px]" 
                                  )}
                                  style={{top: phase.position.y}}
                                >
                                    <MilestoneCard
                                        phase={phase}
                                        isActive={isActive}
                                        index={index}
                                        variant={variant}
                                        onClick={(p, e) => handlePhaseClick(p)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
            <BottomNavigation />
        </div>
    );
}