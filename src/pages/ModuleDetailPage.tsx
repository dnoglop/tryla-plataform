// ARQUIVO: src/pages/ModuleDetailPage.tsx (VERSÃO FINAL COM HOVER BORDER GRADIENT)

import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    getModuleById,
    getPhasesByModuleId,
    getUserPhaseStatus,
    Phase,
    PhaseStatus,
} from "@/services/moduleService";
import { getProfile, Profile } from "@/services/profileService";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Componentes e Ícones
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    CheckCircle2,
    Lock,
    Star,
    FileText,
    Gamepad2,
    Video,
    Sparkles,
    Users,
    Crown,
    ThumbsUp,
} from "lucide-react";

// --- COMPONENTE ContinuousMovingBorder ---
export function ContinuousMovingBorder({
    children,
    as: Component = "div",
    containerClassName,
    className,
    ...rest
}: {
    children?: React.ReactNode;
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    [key: string]: any;
}) {
    return (
        <Component
            className={cn(
                "relative h-full w-full overflow-hidden bg-background p-[2px] transition-all duration-300", // Aumentado o padding para p-[2px]
                containerClassName,
            )}
            {...rest}
        >
            <div
                className={cn(
                    "absolute inset-[-1000%] animate-[spin_6s_linear_infinite]",
                    "bg-[conic-gradient(from_90deg_at_50%_50%,#fdba74_0%,#f97316_50%,#fdba74_100%)]",
                )}
            />
            <div
                className={cn(
                    "relative z-20 h-full w-full rounded-[inherit] bg-card",
                    className,
                )}
            >
                {children}
            </div>
        </Component>
    );
}

// --- LÓGICA DE NÍVEIS ---
const LEVELS = [
  { name: "Semente", minXp: 0 }, { name: "Eco", minXp: 100 }, { name: "Pulso", minXp: 200 },
  { name: "Chave", minXp: 300 }, { name: "Rastro", minXp: 400 }, { name: "Brilho", minXp: 500 },
  { name: "Voo", minXp: 600 }, { name: "Passo", minXp: 700 },
];

const calculateLevelInfo = (xp: number) => {
    if (typeof xp !== "number" || xp < 0) xp = 0;
    const currentLevel =
        [...LEVELS].reverse().find((level) => xp >= level.minXp) || LEVELS[0];
    return { level: currentLevel };
};

// --- TIPOS E INTERFACES ---
interface TrailPhase extends Phase {
    status: PhaseStatus;
    isCurrent: boolean;
    isLocked: boolean;
}
interface ModuleDetailData {
    userProfile: Profile;
    module: {
        id: number;
        name: string;
        description: string;
        emoji: string;
        tags: string[];
    };
    phases: TrailPhase[];
    totalCompleted: number;
}

// --- COMPONENTES DE UI ---
const ModuleHeader = ({ module, userProfile, totalCompleted, totalPhases }) => {
    const levelInfo = calculateLevelInfo(userProfile.xp || 0);
    return (
        <motion.header
            variants={{
                hidden: { y: -20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
            }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 text-white m-2 sm:m-4 rounded-3xl relative overflow-hidden"
        >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full opacity-50"></div>
            <div className="flex justify-between items-center mb-6">
                <Link to="/modulos">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="font-bold text-primary">
                            {userProfile.xp || 0} XP
                        </p>
                        <p className="text-sm text-white/70">
                            Você é nível {levelInfo.level.name}
                        </p>
                    </div>
                    
                        <img
                            src={userProfile?.avatar_url || ""}
                            alt="Perfil"
                            className="h-12 w-12 rounded-full border-2 border-white/20 shadow-md"
                        />
                    
                </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {module.name}
            </h1>
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
                {module.tags?.map((tag) => (
                    <div
                        key={tag}
                        className="text-xs bg-white/20 text-white px-2 py-1 rounded-full backdrop-blur-sm"
                    >
                        #{tag}
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-white/80">
                    <span>Sua evolução no módulo</span>
                    <span>
                        {totalCompleted} / {totalPhases}
                    </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                    <motion.div
                        className="h-full essencia-valor rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(totalCompleted / totalPhases) * 100}%`,
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>
        </motion.header>
    );
};
const SocialProof = () => (
    <motion.div
        variants={{
            hidden: { scale: 0.95, opacity: 0 },
            visible: { scale: 1, opacity: 1 },
        }}
        className="bg-card rounded-2xl p-4 border flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-center sm:text-left"
    >
        <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
                <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                    src="https://ui-avatars.com/api/?name=A&background=4f46e5&color=fff"
                    alt="User"
                />
                <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                    src="https://ui-avatars.com/api/?name=B&background=16a34a&color=fff"
                    alt="User"
                />
                <img
                    className="inline-block h-10 w-10 rounded-full ring-2 ring-background"
                    src="https://ui-avatars.com/api/?name=C&background=c026d3&color=fff"
                    alt="User"
                />
            </div>
            <p className="text-sm font-medium text-muted-foreground leading-tight">
                Junte-se a{" "}
                <span className="text-foreground font-bold">
                    +127 exploradores!
                </span>
            </p>
        </div>
        <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <Sparkles className="w-5 h-5 opacity-80" />
            <span>Muito popular</span>
        </div>
    </motion.div>
);

const PhaseCard = ({ phase, onPhaseClick, isLast }: { phase: TrailPhase, onPhaseClick: (phase: TrailPhase) => void, isLast: boolean }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-200px 0px" });

    const getIconForType = (type: string) => ({ video: Video, quiz: Gamepad2 }[type] || FileText);
    const Icon = getIconForType(phase.type);

    let variant = 'locked';
    if (phase.status === 'completed') variant = 'completed';
    else if (phase.isCurrent) variant = 'current';
    else if (!phase.isLocked) variant = 'next';

    const isClickable = variant !== 'locked';

    const CardContent = () => (
         <div className="flex items-start space-x-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md", { "bg-gradient-to-br from-green-500 to-emerald-600": variant === 'completed', "bg-gradient-to-br from-primary to-orange-400": variant === 'current' || variant === 'next', "bg-muted": variant === 'locked' })}>
                {variant === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : variant === 'locked' ? <Lock className="w-6 h-6 text-muted-foreground" /> : <Icon className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-lg break-words">{phase.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">{phase.description}</p>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground"><FileText className="w-3 h-3" /><span>{phase.type}</span></div>
                        <div className="flex items-center gap-1.5 text-primary font-semibold"><Star className="w-3 h-3" /><span>+5XP</span></div>
                    </div>
                    {variant === 'completed' && (<div className="flex items-center gap-1 text-xs text-green-600 font-medium"><ThumbsUp className="w-3 h-3" /><span>98% Útil</span></div>)}
                </div>
            </div>
        </div>
    );

    return (
        <div ref={ref} className="flex items-stretch gap-4">
            {/* Coluna da Timeline com Correção */}
            <div className="flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className={cn("w-5 h-5 rounded-full flex-shrink-0 z-10 flex items-center justify-center", 
                        variant === 'completed' ? 'bg-green-500' : variant === 'current' ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}
                >
                    <div className="h-2 w-2 rounded-full bg-background" />
                </motion.div>
                {!isLast && (
                    <div className="w-0.5 flex-grow bg-muted relative">
                        {/* Linha Laranja (para a fase atual) */}
                        <motion.div
                            className="absolute inset-0 w-full origin-top bg-primary"
                            initial={{ scaleY: 0 }}
                            animate={isInView && variant === 'current' ? { scaleY: 1 } : { scaleY: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        />
                        {/* Linha Verde (para fases completas) */}
                        <motion.div
                            className="absolute inset-0 w-full origin-top bg-green-500"
                            initial={{ scaleY: 0 }}
                            animate={isInView && variant === 'completed' ? { scaleY: 1 } : { scaleY: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                        />
                    </div>
                )}
            </div>

            {/* Coluna do Card de Conteúdo */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => isClickable && onPhaseClick(phase)}
                className={cn("w-full transition-all pb-8", { "cursor-pointer": isClickable })}
            >
                {variant === 'current' ? (
                    <ContinuousMovingBorder containerClassName="rounded-2xl" as="div" className="p-5">
                        <CardContent />
                    </ContinuousMovingBorder>
                ) : (
                    <div className={cn("bg-card rounded-2xl p-5 shadow-sm border", { "border-green-500/30": variant === 'completed', "border-border hover:border-primary/50": variant === 'next', "border-dashed opacity-70": variant === 'locked' })}><CardContent /></div>
                )}
            </motion.div>
        </div>
    );
};

const CompletionCard = ({ moduleName }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white text-center shadow-2xl relative overflow-hidden mt-8"
    >
        <Sparkles className="w-16 h-16 text-white/20 absolute -top-4 -right-4" />
        <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
        <h3 className="text-2xl font-bold mb-2">Jornada Concluída!</h3>
        <p className="text-white/80 mb-6">
            Parabéns por dominar o módulo "{moduleName}"!
        </p>
        <Button className="bg-white text-green-600 hover:bg-white/90">
            Ver as minhas conquistas
        </Button>
    </motion.div>
);

// --- COMPONENTE PRINCIPAL ---
export default function ModuleDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const moduleId = parseInt(id || "0");
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { data, isLoading, error } = useQuery<ModuleDetailData>({
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
            if (!module) throw new Error("Jornada não encontrada.");
            const statusMap: { [key: number]: PhaseStatus } = {};
            for (const phase of phases) {
                statusMap[phase.id] = await getUserPhaseStatus(
                    user.id,
                    phase.id,
                );
            }
            let currentPhaseFound = false;
            const trailPhases: TrailPhase[] = phases.map((phase, index) => {
                const status = statusMap[phase.id];
                const isLocked =
                    index > 0 &&
                    statusMap[phases[index - 1].id] !== "completed";
                let isCurrent = false;
                if (!isLocked && status !== "completed" && !currentPhaseFound) {
                    isCurrent = true;
                    currentPhaseFound = true;
                }
                return { ...phase, status, isLocked, isCurrent };
            });
            return {
                userProfile,
                module,
                phases: trailPhases,
                totalCompleted: trailPhases.filter(
                    (p) => p.status === "completed",
                ).length,
            };
        },
        enabled: !!moduleId,
    });

    const handlePhaseClick = (phase: TrailPhase) => {
        if (phase.isLocked) return;
        if (phase.status !== "completed")
            confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
        navigate(`/modulo/${moduleId}/fase/${phase.id}`);
    };

    if (isLoading) return <Skeleton className="h-screen w-full bg-muted" />;
    if (error || !data)
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-destructive">
                    {error?.message || "Jornada não encontrada."}
                </p>
            </div>
        );

    const { userProfile, module, phases, totalCompleted } = data;
    const allCompleted = totalCompleted === phases.length;

    return (
        <div className="flex flex-col pb-24 min-h-screen bg-background font-nunito">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1 } },
                }}
            >
                <ModuleHeader
                    module={module}
                    userProfile={userProfile}
                    totalCompleted={totalCompleted}
                    totalPhases={phases.length}
                />
            </motion.div>
            <main className="flex-1 overflow-y-auto">
                <motion.div
                    className="max-w-2xl mx-auto px-4 py-8 space-y-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.1 } },
                    }}
                >
                    <SocialProof />
                    <div className="space-y-8 pt-4">
                        {phases.map((phase, index) => (
                            <PhaseCard
                                key={phases[index].id}
                                phase={phases[index]}
                                onPhaseClick={handlePhaseClick}
                                isLast={index === phases.length - 1}
                            />
                        ))}
                        {allCompleted && (
                            <CompletionCard moduleName={module.name} />
                        )}
                    </div>
                </motion.div>
            </main>
            <BottomNavigation />
        </div>
    );
}
