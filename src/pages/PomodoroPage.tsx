// src/pages/PomodoroPage.tsx (VERSÃO FINAL E CORRIGIDA)

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, Profile } from "@/services/profileService";
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"; // Usando a versão padrão do shadcn

export default function PomodoroPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [mode, setMode] = useState<TimerMode>("focus");
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [cycles, setCycles] = useState(0);

    const totalDuration =
        mode === "focus" ? 25 * 60 : mode === "shortBreak" ? 5 * 60 : 15 * 60;
    const progressPercentage = ((totalDuration - time) / totalDuration) * 100;

    const switchMode = useCallback((newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        switch (newMode) {
            case "focus":
                setTime(25 * 60);
                break;
            case "shortBreak":
                setTime(5 * 60);
                break;
            case "longBreak":
                setTime(15 * 60);
                break;
        }
    }, []);

    const handleTimerEnd = useCallback(() => {
        setIsActive(false);
        if (mode === "focus") {
            const newCycles = cycles + 1;
            setCycles(newCycles);
            if (newCycles % 4 === 0) {
                switchMode("longBreak");
            } else {
                switchMode("shortBreak");
            }
        } else {
            switchMode("focus");
        }
    }, [cycles, mode, switchMode]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) setProfile(await getProfile(user.id));
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => setTime((t) => t - 1), 1000);
        } else if (time === 0) {
            handleTimerEnd();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, handleTimerEnd]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => switchMode(mode);
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background">
            <header className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">
                                Modo Foco
                            </h1>
                        </div>
                    </div>
                    <Link to="/perfil">
                        <img
                            src={profile?.avatar_url || ""}
                            alt="Foto do perfil"
                            className="h-12 w-12 rounded-full object-cover border-2 border-background shadow-md transition-transform hover:scale-110"
                        />
                    </Link>
                </div>
            </header>

            <div className="mx-4 sm:mx-6 lg:mx-8 mb-6">
                <div className="bg-card p-6 rounded-2xl shadow-lg border">
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        Técnica Pomodoro
                    </h2>
                    <div className="text-sm text-muted-foreground space-y-3">
                        <p>
                            A Técnica Pomodoro é um método de gerenciamento de
                            tempo que divide o trabalho em intervalos de 25
                            minutos.
                        </p>
                        <p>
                            Esta técnica divide o trabalho em intervalos de foco
                            seguidos por pausas curtas.
                        </p>

                        {/* ======================================================= */}
                        {/* ||      ESTA É A ESTRUTURA FINAL E CORRETA           || */}
                        {/* ======================================================= */}
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-2"
                        >
                            <AccordionItem
                                value="como-funciona"
                                className="border-b-0"
                            >
                                <AccordionTrigger className="bg-muted/50 hover:no-underline px-4 rounded-lg font-medium text-foreground">
                                    Como funciona
                                </AccordionTrigger>
                                <AccordionContent className="p-4">
                                    <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                                        <li>25 minutos de foco intenso</li>
                                        <li>5 minutos de pausa</li>
                                        <li>
                                            A cada 4 ciclos, uma pausa longa de
                                            15 minutos
                                        </li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem
                                value="beneficios"
                                className="border-b-0"
                            >
                                <AccordionTrigger className="bg-primary/10 hover:no-underline px-4 rounded-lg font-medium text-primary/90">
                                    Benefícios da técnica
                                </AccordionTrigger>
                                <AccordionContent className="p-4">
                                    <ul className="text-xs space-y-1 text-primary/80 list-disc list-inside">
                                        <li>Melhora o foco e concentração</li>
                                        <li>Reduz a procrastinação</li>
                                        <li>Aumenta a produtividade</li>
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </div>

            <main className="flex flex-col items-center justify-center p-4 text-center">
                {/* O resto do seu código da página continua aqui... */}
                <div className="w-full max-w-sm bg-card p-8 rounded-3xl shadow-lg border">
                    <div className="flex justify-center bg-muted p-1 rounded-full mb-8">
                        <button
                            onClick={() => switchMode("focus")}
                            className={cn(
                                "flex-1 py-2 rounded-full text-sm font-semibold transition-colors",
                                mode === "focus" &&
                                    "bg-primary text-primary-foreground shadow",
                            )}
                        >
                            Foco
                        </button>
                        <button
                            onClick={() => switchMode("shortBreak")}
                            className={cn(
                                "flex-1 py-2 rounded-full text-sm font-semibold transition-colors",
                                mode === "shortBreak" &&
                                    "bg-primary text-primary-foreground shadow",
                            )}
                        >
                            Pausa Curta
                        </button>
                        <button
                            onClick={() => switchMode("longBreak")}
                            className={cn(
                                "flex-1 py-2 rounded-full text-sm font-semibold transition-colors",
                                mode === "longBreak" &&
                                    "bg-primary text-primary-foreground shadow",
                            )}
                        >
                            Pausa Longa
                        </button>
                    </div>
                    <div className="relative w-48 h-48 sm:w-60 sm:h-60 mx-auto mb-8">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle
                                className="text-muted"
                                strokeWidth="7"
                                stroke="currentColor"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="transparent"
                            />
                            <circle
                                className="text-primary"
                                strokeWidth="7"
                                strokeLinecap="round"
                                stroke="currentColor"
                                cx="50"
                                cy="50"
                                r="45"
                                fill="transparent"
                                strokeDasharray="282.743"
                                strokeDashoffset={
                                    282.743 -
                                    (progressPercentage / 100) * 282.743
                                }
                                style={{
                                    transform: "rotate(-90deg)",
                                    transformOrigin: "50% 50%",
                                    transition: "stroke-dashoffset 1s linear",
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl sm:text-5xl font-bold text-foreground">
                                {formatTime(time)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={resetTimer}
                            className="h-12 w-12 rounded-full bg-muted hover:bg-muted/80"
                        >
                            <RotateCcw className="h-6 w-6 text-muted-foreground" />
                        </Button>
                        <Button
                            onClick={toggleTimer}
                            className="h-16 w-16 rounded-full shadow-lg text-primary-foreground text-lg font-bold"
                        >
                            {isActive ? (
                                <Pause className="h-8 w-8" />
                            ) : (
                                <Play className="h-8 w-8" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleTimerEnd}
                            className="h-12 w-12 rounded-full bg-muted hover:bg-muted/80"
                        >
                            <SkipForward className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 mb-6">
                    Ciclos de foco completados: {cycles}
                </p>
                <Button
                    onClick={() => navigate("/lab")}
                    variant="outline"
                    className="flex items-center gap-2 bg-card hover:bg-muted border text-foreground px-6 py-3 rounded-full shadow-sm"
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar ao Lab
                </Button>
            </main>
        </div>
    );
}

// Definição de tipo para o modo do timer
type TimerMode = "focus" | "shortBreak" | "longBreak";
