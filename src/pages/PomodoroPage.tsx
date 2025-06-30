// src/pages/PomodoroPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft, Play, Pause, RotateCcw, SkipForward, Brain, Coffee, CheckCircle2, Flame, Zap, Award, Star, Info
} from "lucide-react";

// --- TIPOS E CONFIGURAÇÕES ---

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface ModeConfig {
  duration: number;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  message: string;
}

const modes: Record<TimerMode, ModeConfig> = {
  focus: {
    duration: 25 * 60,
    label: "Foco",
    color: "text-primary",
    bgColor: "bg-primary",
    icon: Brain,
    message: "Hora de entrar no flow! Concentração total na sua missão.",
  },
  shortBreak: {
    duration: 5 * 60,
    label: "Pausa",
    color: "text-green-500",
    bgColor: "bg-green-500",
    icon: Coffee,
    message: "Você merece essa pausa! Estique as pernas, olhe pela janela.",
  },
  longBreak: {
    duration: 15 * 60,
    label: "Descanso",
    color: "text-sky-500",
    bgColor: "bg-sky-500",
    icon: Coffee,
    message: "Pausa longa ativada. Recarregue as energias para o próximo round.",
  },
};

// Adicionando as novas colunas à interface Profile para tipagem forte
interface PomodoroProfile extends Profile {
  pomodoro_cycles_today?: number;
  last_pomodoro_date?: string;
  pomodoro_streak?: number;
}

// --- COMPONENTES DE SKELETON E HEADER ---

const PomodoroPageSkeleton = () => (
    <div className="min-h-screen bg-background p-4 animate-pulse">
        <div className="max-w-md lg:max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-24 rounded-3xl bg-muted" />
            <div className="lg:grid lg:grid-cols-5 lg:gap-8">
                <div className="space-y-6 lg:col-span-3">
                    <Skeleton className="h-12 rounded-full bg-muted" />
                    <Skeleton className="h-96 rounded-3xl bg-muted" />
                </div>
                <div className="space-y-6 lg:col-span-2 mt-6 lg:mt-0">
                    <Skeleton className="h-28 rounded-2xl bg-muted" />
                    <Skeleton className="h-20 rounded-2xl bg-muted" />
                    <Skeleton className="h-24 rounded-2xl bg-muted" />
                </div>
            </div>
        </div>
    </div>
);

const PomodoroHeader = ({ profile }: { profile: PomodoroProfile | null }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-3xl p-6 text-white relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">Timer de Sprint</h1>
                        <p className="text-white/70 text-sm">Foque. Descanse. Repita.</p>
                    </div>
                </div>
                {profile && (
                    <img
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name?.split(" ")[0] || "A"}`}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                    />
                )}
            </div>
        </motion.div>
    );
};

// --- COMPONENTE PRINCIPAL ---

export default function PomodoroPage() {
    const [profile, setProfile] = useState<PomodoroProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [mode, setMode] = useState<TimerMode>("focus");
    const [time, setTime] = useState(modes.focus.duration);
    const [isActive, setIsActive] = useState(false);

    const [cyclesToday, setCyclesToday] = useState(0); 
    const [streak, setStreak] = useState(0);

    const [showCelebration, setShowCelebration] = useState(false);

    const currentMode = useMemo(() => modes[mode], [mode]);

    const handleTimerEnd = useCallback(async () => {
        setIsActive(false);
        setShowCelebration(true);

        if (mode === "focus" && profile) {
            // Chama a função no DB para fazer toda a mágica
            const { error } = await supabase.rpc('log_pomodoro_cycle', { 
                p_user_id: profile.id, 
                p_xp_amount: 10 // XP ganho por ciclo
            });

            if (error) {
                console.error("Erro ao registrar ciclo de pomodoro:", error);
            } else {
                // Se a chamada foi um sucesso, atualiza o estado local para refletir a mudança
                // Também atualiza o streak se necessário
                const today = new Date().toISOString().split('T')[0];
                const lastDate = profile.last_pomodoro_date;
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                setCyclesToday(prev => prev + 1);

                if (lastDate !== today && lastDate === yesterday) {
                    setStreak(prev => prev + 1);
                } else if (lastDate !== today) {
                    setStreak(1);
                }
            }

            // Lógica para decidir o próximo modo
            const nextCyclesCount = cyclesToday + 1;
            switchMode(nextCyclesCount % 4 === 0 ? "longBreak" : "shortBreak");
        } else {
            // Se for fim de uma pausa, apenas volta para o foco
            switchMode("focus");
        }

        setTimeout(() => setShowCelebration(false), 3500);
    }, [profile, mode, cyclesToday]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0 && isActive) {
            handleTimerEnd();
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isActive, time, handleTimerEnd]);

    useEffect(() => {
        const fetchUserProfileAndStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const userProfile: PomodoroProfile | null = await getProfile(user.id);
                    setProfile(userProfile);

                    if (userProfile) {
                        const today = new Date().toISOString().split('T')[0];
                        // Se o último ciclo não foi hoje, os ciclos do dia são 0. Senão, usa o valor do DB.
                        if (userProfile.last_pomodoro_date === today) {
                            setCyclesToday(userProfile.pomodoro_cycles_today || 0);
                        } else {
                            setCyclesToday(0); // Reseta a contagem para o novo dia
                        }
                        setStreak(userProfile.pomodoro_streak || 0);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar perfil e stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserProfileAndStats();
    }, []);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => { setIsActive(false); setTime(currentMode.duration); };
    const switchMode = (newMode: TimerMode) => { setMode(newMode); setTime(modes[newMode].duration); setIsActive(false); };
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60); const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };
    const progress = ((currentMode.duration - time) / currentMode.duration) * 100;

    if (isLoading) { return <PomodoroPageSkeleton />; }

    return (
        <div className="min-h-screen bg-background font-nunito pb-24">
            <div className="max-w-md lg:max-w-5xl mx-auto p-4 space-y-6">

                <PomodoroHeader profile={profile} />

                {/* Container principal que se divide em duas colunas em telas grandes */}
                <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">

                    {/* Coluna Esquerda: O Timer (ocupa 3 de 5 colunas no desktop) */}
                    <div className="space-y-6 lg:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                            className="flex bg-muted p-1 rounded-full"
                        >
                            {(Object.keys(modes) as TimerMode[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={() => switchMode(key)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors",
                                        mode === key ? `${currentMode.bgColor} text-white shadow-md` : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {modes[key].label}
                                </button>
                            ))}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1, transition: { delay: 0.4, type: "spring" } }}
                            className="bg-card border rounded-3xl p-6 sm:p-8"
                        >
                            <div className="relative w-60 h-60 sm:w-64 sm:h-64 mx-auto">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-muted/20" />
                                    <motion.circle
                                        cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" fill="transparent"
                                        strokeLinecap="round" className={currentMode.color}
                                        strokeDasharray={2 * Math.PI * 45}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
                                        transition={{ duration: 1, ease: "linear" }}
                                    />
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <motion.div
                                        className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 shadow-lg ${currentMode.bgColor}`}
                                        animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
                                        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
                                    >
                                        <currentMode.icon className="w-7 h-7 text-white" />
                                    </motion.div>
                                    <div className="text-5xl sm:text-6xl font-bold text-foreground tabular-nums">{formatTime(time)}</div>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={mode}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-muted-foreground text-sm mt-2 px-4"
                                        >
                                            {currentMode.message}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Button variant="ghost" size="icon" onClick={resetTimer} className="h-14 w-14 rounded-full bg-muted hover:bg-muted/80">
                                    <RotateCcw className="w-6 h-6 text-muted-foreground" />
                                </Button>
                                <Button onClick={toggleTimer} className={cn("h-20 w-20 rounded-full shadow-lg text-white", currentMode.bgColor)}>
                                    <AnimatePresence mode="wait">
                                        {isActive ? 
                                            <motion.div key="pause" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}><Pause className="h-9 w-9" /></motion.div> : 
                                            <motion.div key="play" initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.5, opacity:0}}><Play className="h-9 w-9 ml-1" /></motion.div>
                                        }
                                    </AnimatePresence>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleTimerEnd} className="h-14 w-14 rounded-full bg-muted hover:bg-muted/80">
                                    <SkipForward className="w-6 h-6 text-muted-foreground" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Coluna Direita: Stats e Infos (ocupa 2 de 5 colunas no desktop) */}
                    <div className="space-y-6 lg:col-span-2 mt-6 lg:mt-0">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
                            <Accordion type="single" collapsible className="w-full bg-card border rounded-2xl px-2">
                                <AccordionItem value="how-to-use" className="border-b-0">
                                    <AccordionTrigger className="font-semibold text-foreground hover:no-underline px-2">
                                        <Info className="w-5 h-5 mr-3 text-primary"/> Como usar o Timer?
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-4">
                                        <ul className="text-sm text-muted-foreground space-y-2 pl-5 pr-2">
                                            <li className="flex items-start gap-3"><Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" /><span><b>Foco (25 min):</b> Escolha uma tarefa e trabalhe nela sem distrações.</span></li>
                                            <li className="flex items-start gap-3"><Coffee className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" /><span><b>Pausa (5 min):</b> Ao final, descanse. Levante-se, tome uma água.</span></li>
                                            <li className="flex items-start gap-3"><Award className="w-5 h-5 text-sky-500 mt-0.5 flex-shrink-0" /><span><b>Descanso (15 min):</b> A cada 4 ciclos, faça uma pausa mais longa.</span></li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-card border rounded-2xl p-3 text-center">
                                <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
                                <div className="text-xl font-bold text-foreground">{cyclesToday}</div>
                                <div className="text-xs text-muted-foreground">Ciclos Hoje</div>
                            </div>
                            <div className="bg-card border rounded-2xl p-3 text-center">
                                <Flame className="w-6 h-6 text-red-500 mx-auto mb-1" />
                                <div className="text-xl font-bold text-foreground">{streak}</div>
                                <div className="text-xs text-muted-foreground">Dias em Streak</div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}>
                            <div className="bg-card border border-primary/20 rounded-2xl p-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Award className="w-6 h-6 text-primary" />
                                    <h3 className="font-bold text-foreground">Meta Diária de Sprints</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">Complete 4 ciclos de foco para ganhar um bônus de 50 XP!</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((cyclesToday / 4) * 100, 100)}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-primary">{cyclesToday}/4</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Modal de Celebração */}
                <AnimatePresence>
                    {showCelebration && (
                        <motion.div
                            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-card rounded-3xl p-8 text-center max-w-sm w-full border"
                                initial={{ scale: 0.8, y: 50 }}
                                animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                                exit={{ scale: 0.8, y: 50 }}
                            >
                                <motion.div
                                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/30"
                                    initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-foreground mb-2">
                                    {mode === 'focus' ? 'Pausa Merecida!' : 'Foco Ativado!'} 🎉
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {mode === 'focus' ? 'Excelente sprint! Agora é hora de relaxar um pouco.' : 'Pausa finalizada. Vamos para o próximo sprint!'}
                                </p>
                                <div className="bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full inline-flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    <span>+10 XP pela sua dedicação!</span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}