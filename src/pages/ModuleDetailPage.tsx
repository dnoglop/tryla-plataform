// ARQUIVO: src/pages/ModuleDetailPage.tsx (VERSÃO JORNADA DO HERÓI)

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    getModuleById,
    getPhasesByModuleId,
    getUserPhaseStatus,
    Phase,
    PhaseStatus,
} from "@/services/moduleService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award } from "lucide-react";
import { getProfile } from "@/services/profileService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion, useScroll, useTransform } from "framer-motion";
import { MilestoneCard } from "@/components/journey/MilestoneCard";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface TrailPhase extends Phase {
    status: PhaseStatus;
    isLocked: boolean;
    position: { x: number; y: number };
}

// --- SKELETON (NÃO PRECISA MUDAR) ---
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

    // --- LÓGICA DE DADOS (useQuery) - Sem alterações ---
    const { data, isLoading, error } = useQuery({
        queryKey: ["moduleDetailData", moduleId],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error("Protagonista não autenticado.");

            const [userProfile, module, phases] = await Promise.all([
                getProfile(user.id),
                getModuleById(moduleId),
                getPhasesByModuleId(moduleId),
            ]);

            if (!module) throw new Error("Reino não encontrado.");

            const statusMap: { [key: number]: PhaseStatus } = {};
            for (const phase of phases) {
                statusMap[phase.id] = await getUserPhaseStatus(
                    user.id,
                    phase.id,
                );
            }

            // A primeira fase nunca está bloqueada. As outras dependem da conclusão da anterior.
            const trailPhases: TrailPhase[] = phases.map((phase, index) => ({
                ...phase,
                status: statusMap[phase.id],
                isLocked:
                    index > 0 &&
                    statusMap[phases[index - 1].id] !== "completed",
                position: { x: 0, y: 0 }, // Posição será calculada depois
            }));

            return { userProfile, module, phases: trailPhases };
        },
        enabled: !!moduleId,
        retry: 1,
    });

    useEffect(() => {
        if (error) {
            toast.error("Erro ao carregar os desafios do Reino.");
            navigate("/modulos");
        }
    }, [error, navigate]);

    // Hooks para Parallax e Animações de Scroll
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: scrollContainerRef });
    const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

    // Calcula as posições dos marcos na trilha
    const generatePhasePositions = (phases: TrailPhase[]): TrailPhase[] => {
        return phases.map((phase, index) => ({
            ...phase,
            position: { x: 0, y: 80 + index * 160 }, // Espaçamento vertical
        }));
    };

    // Desenha a "Trilha de Energia" entre os marcos
    const renderConnection = (
        from: TrailPhase,
        to: TrailPhase,
        index: number,
    ) => {
        const isPathActive = from.status === "completed";
        // Ajusta a posição Y para o centro do novo tamanho do card
        const fromY = from.position.y + 42;
        const toY = to.position.y + 42;
        const deltaY = toY - fromY;
        const pathData = `M 2,0 V ${deltaY}`;

        return (
            // POSICIONAMENTO RESPONSIVO: à esquerda no mobile, no centro no desktop
            <div
                key={`connection-${index}`}
                className="absolute z-0 h-full left-6 sm:left-1/2" // 1.5rem da esquerda / 50%
                style={{ top: fromY, height: deltaY }}
            >
                <svg width="4" height="100%" style={{ overflow: "visible" }}>
                    <path
                        d={pathData}
                        stroke="hsl(var(--muted))"
                        strokeWidth="4"
                        fill="none"
                    />
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

    const handlePhaseClick = (
        phase: Phase,
        event: React.MouseEvent<HTMLDivElement>,
    ) => {
        // Dispara partículas no elemento clicado ("Toque de Ativação")
        const rect = event.currentTarget.getBoundingClientRect();
        confetti({
            particleCount: 50,
            spread: 50,
            origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
            },
        });
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    if (isLoading) return <ModuleDetailSkeleton />;

    if (error || !data) {
        return (
            <div className="p-4 text-center">
                <p className="text-destructive">
                    {error?.message || "Reino não encontrado."}
                </p>
                <Button onClick={() => navigate("/modulos")} className="mt-4">
                    Voltar ao Mapa da Saga
                </Button>
            </div>
        );
    }

    const { userProfile, module, phases } = data;
    const positionedPhases = generatePhasePositions(phases);
    const containerHeight = Math.max(800, positionedPhases.length * 220 + 200);

    return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden">
            {/* Fundo com Efeito Parallax */}
            <motion.div
                className="absolute top-0 left-0 w-full h-[120%] bg-cover bg-center z-0 animated-gradient-bg"
                style={{ y: parallaxY, opacity: 0.5 }}
            />

            {/* Header Fixo com Glassmorphism */}
            <header className="sticky top-0 p-4 sm:p-6 bg-background/80 backdrop-blur-lg border-b border-border z-30">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/modulos")}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95 border border-border"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary/10 text-lg">
                                {module.emoji || "📚"}
                            </div>
                            <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                                Jornada por "{module.name}"
                            </h1>
                        </div>
                    </div>
                    <Link to="/perfil">
                        <img
                            src={userProfile?.avatar_url || ""}
                            alt="Perfil"
                            className="h-12 w-12 rounded-full border-2 border-border shadow-md"
                        />
                    </Link>
                </div>
            </header>

            <main
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto grid place-items-center p-4 relative z-10"
            >
                {phases.length > 0 ? (
                    <div className="relative w-full max-w-2xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-border/50">
                                <Award className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-primary">
                                    {
                                        phases.filter(
                                            (p) => p.status === "completed",
                                        ).length
                                    }{" "}
                                    de {phases.length} missões concluídas
                                </span>
                            </div>
                        </div>

                        <div
                            className="relative"
                            style={{ height: containerHeight }}
                        >
                            {/* Desenha as trilhas de energia */}
                            {positionedPhases
                                .slice(0, -1)
                                .map((phase, index) =>
                                    renderConnection(
                                        phase,
                                        positionedPhases[index + 1],
                                        index,
                                    ),
                                )}

                            {/* Renderiza os marcos da jornada */}
                            {positionedPhases.map((phase, index) => (
                                // POSICIONAMENTO DO CARD RESPONSIVO
                                <div
                                    key={phase.id}
                                    className={cn(
                                        "absolute",
                                        // MOBILE: afasta 8rem da esquerda
                                        "left-[4.5rem] right-0",
                                        // DESKTOP: centraliza
                                        "sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[380px]",
                                    )}
                                    style={{ top: phase.position.y }}
                                >
                                    <MilestoneCard
                                        phase={phase}
                                        isActive={
                                            phase.status === "inProgress" ||
                                            (phase.status === "notStarted" &&
                                                !phase.isLocked)
                                        }
                                        index={index}
                                        onClick={handlePhaseClick}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border text-center">
                        <p className="text-muted-foreground">
                            Este Reino ainda não possui missões. Em breve, novos
                            desafios surgirão!
                        </p>
                    </div>
                )}
            </main>
            <BottomNavigation />
        </div>
    );
}
