// src/pages/PhaseDetailPage.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    ArrowLeft,
    ArrowRight,
    Volume2,
    VolumeX,
    CheckCircle,
    Clock,
    Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import QuizQuestion from "@/components/QuizQuestion";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getPhaseById,
    getModuleById,
    getPhasesByModuleId,
    getQuestionsByPhaseId,
    completePhaseAndAwardXp,
    awardQuizXp,
    updateUserPhaseStatus,
    getUserPhaseStatus,
    getModuleProgress,
    getModules,
    Phase,
    Module,
} from "@/services/moduleService";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";

// --- MUDANÇA: SKELETON ATUALIZADO COM CORES DE TEMA ---
const PhaseDetailSkeleton = () => (
    <div className="min-h-screen bg-background animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                <Skeleton className="h-7 w-48 bg-muted" />
            </div>
        </header>
        <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl bg-muted" />
            <Skeleton className="aspect-video w-full rounded-2xl bg-muted" />
        </main>
    </div>
);

// --- FUNÇÕES E COMPONENTES AUXILIARES ---
const formatTime = (s: number | null) =>
    s === null
        ? "00:00"
        : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const calculateXpForTime = (s: number, q: number) => {
    const sPerQ = s / (q || 1);
    return sPerQ <= 10 ? 25 : sPerQ <= 20 ? 15 : 10;
};

const NextModuleCard = ({
    nextModule,
    onContinue,
    onBackToModules,
}: {
    nextModule: Module;
    onContinue: () => void;
    onBackToModules: () => void;
}) => (
    // MUDANÇA: CORES DO CARD ADAPTADAS PARA O TEMA
    <div className="mt-6 p-6 bg-primary/10 rounded-2xl border border-primary/20">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-primary/20 text-2xl">
                {nextModule.emoji || "📚"}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                    Próxima Missão
                </h3>
                <h4 className="text-xl font-semibold text-primary mb-2">
                    {nextModule.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                    {nextModule.description}
                </p>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onContinue} className="flex-1">
                Seguir para o Próximo Módulo{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={onBackToModules} variant="outline">
                <Home className="mr-2 h-4 w-4" /> Voltar para as Trilhas
            </Button>
        </div>
    </div>
);

export default function PhaseDetailPage() {
    const { moduleId, phaseId } = useParams<{
        moduleId: string;
        phaseId: string;
    }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showRewardModal } = useRewardModal();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [quizElapsedTime, setQuizElapsedTime] = useState<number | null>(null);
    const [moduleCompleted, setModuleCompleted] = useState(false);
    const {
        isPlaying,
        isLoading: isLoadingAudio,
        playText,
        stopAudio,
    } = useTextToSpeech();
    const [speechRate, setSpeechRate] = useState(1.15);
    const speedOptions = [1.15, 1.25, 1.5];

    useEffect(() => {
        const getUserId = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                if (phaseId) {
                    const currentStatus = await getUserPhaseStatus(
                        user.id,
                        Number(phaseId),
                    );
                    if (currentStatus === "notStarted") {
                        updateUserPhaseStatus(
                            user.id,
                            Number(phaseId),
                            "inProgress",
                        );
                    }
                }
            }
        };
        getUserId();
        return () => {
            stopAudio();
        };
    }, [phaseId, stopAudio]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["phaseDetailData", phaseId],
        queryFn: async () => {
            if (!phaseId || !moduleId || !userId)
                throw new Error("IDs não encontrados.");
            const pId = Number(phaseId);
            const mId = Number(moduleId);
            const [
                phase,
                module,
                allPhases,
                questions,
                allModules,
                moduleProgress,
            ] = await Promise.all([
                getPhaseById(pId),
                getModuleById(mId),
                getPhasesByModuleId(mId),
                getQuestionsByPhaseId(pId),
                getModules(),
                getModuleProgress(userId, mId),
            ]);
            return {
                phase,
                module,
                allPhases,
                questions,
                allModules,
                moduleProgress,
            };
        },
        enabled: !!phaseId && !!moduleId && !!userId,
    });

    const {
        phase,
        module,
        allPhases = [],
        questions = [],
        allModules = [],
        moduleProgress = 0,
    } = data || {};
    const currentPhaseIndex = allPhases.findIndex(
        (p) => p.id === Number(phaseId),
    );
    const previousPhase =
        currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase =
        currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1
            ? allPhases[currentPhaseIndex + 1]
            : null;
    const currentModuleIndex = allModules.findIndex(
        (m) => m.id === Number(moduleId),
    );
    const nextModule =
        currentModuleIndex !== -1 && currentModuleIndex < allModules.length - 1
            ? allModules[currentModuleIndex + 1]
            : null;

    const handleReadContent = () => {
        if (!phase?.content) return;
        
        if (isPlaying) {
            stopAudio();
        } else {
            const textContent = phase.content.replace(/<[^>]*>/g, '');
            playText(textContent, speechRate);
        }
    };

    const navigateToPrevious = () => {
        if (previousPhase) {
            navigate(`/modulo/${moduleId}/fase/${previousPhase.id}`);
        }
    };

    const navigateToNext = () => {
        if (nextPhase) {
            navigate(`/modulo/${moduleId}/fase/${nextPhase.id}`);
        } else {
            setModuleCompleted(true);
        }
    };

    const handleCompletePhase = async () => {
        if (!userId || !phaseId || !moduleId) return;
        
        setIsSubmitting(true);
        try {
            const result = await completePhaseAndAwardXp(
                userId,
                Number(phaseId),
                Number(moduleId),
                false
            );

            if (result.xpFromPhase > 0 || result.xpFromModule > 0) {
                showRewardModal({
                    phaseXp: result.xpFromPhase,
                    moduleXp: result.xpFromModule,
                    onClose: () => navigateToNext()
                });
            } else {
                navigateToNext();
            }

            queryClient.invalidateQueries({ queryKey: ["phaseDetailData"] });
        } catch (error) {
            console.error("Erro ao completar fase:", error);
            toast.error("Erro ao completar fase");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCorrectAnswer = async () => {
        if (!userId || !phaseId || quizElapsedTime === null) return;

        const timeBonus = calculateXpForTime(quizElapsedTime, questions.length);
        const awarded = await awardQuizXp(userId, Number(phaseId), timeBonus);

        if (awarded) {
            toast.success(`Parabéns! +${timeBonus} XP pelo tempo!`);
        }

        setQuizCompleted(true);
    };

    const handleNextModule = () => {
        if (nextModule) {
            navigate(`/modulo/${nextModule.id}`);
        }
    };

    const handleBackToModules = () => {
        navigate("/modulos");
    };

    if (isLoading) return <PhaseDetailSkeleton />;
    if (!phase || !module)
        return (
            <div className="p-4 text-center">
                Fase ou Módulo não encontrado.
            </div>
        );

    return (
        <div className="min-h-screen bg-background pb-24">
            <header className="p-4 sm:p-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/modulo/${moduleId}`)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground truncate">
                                {module.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <div className="p-6 bg-card rounded-2xl shadow-sm border">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
                                {phase.name}
                            </h2>
                            {phase.description && (
                                <p className="text-muted-foreground mt-2 text-base">
                                    {phase.description}
                                </p>
                            )}
                        </div>
                        <div className="flex-shrink-0">
                            <div className="relative flex items-center justify-center">
                                <svg
                                    width={70}
                                    height={70}
                                    className="transform -rotate-90"
                                >
                                    <circle
                                        cx={35}
                                        cy={35}
                                        r={28}
                                        stroke="hsl(var(--muted))"
                                        strokeWidth={7}
                                        fill="none"
                                    />
                                    <circle
                                        cx={35}
                                        cy={35}
                                        r={28}
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={7}
                                        fill="none"
                                        strokeDasharray={175.9}
                                        strokeDashoffset={
                                            175.9 -
                                            (moduleProgress / 100) * 175.9
                                        }
                                        strokeLinecap="round"
                                        className="transition-all duration-500 ease-in-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-foreground">
                                        {Math.round(moduleProgress)}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground mt-2 font-medium">
                                da meta concluída!
                            </p>
                        </div>
                    </div>
                </div>

                {phase.type === "video" && phase.video_url && (
                    <YoutubeEmbed videoId={phase.video_url} />
                )}

                {(phase.type === "text" || phase.type === "challenge") &&
                    phase.content && (
                        <div className="p-6 bg-card rounded-2xl shadow-sm border">
                            <div className="flex justify-end items-center gap-4 mb-4">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleReadContent}
                                    disabled={isLoadingAudio}
                                >
                                    {isPlaying ? (
                                        <VolumeX className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Volume2 className="mr-2 h-4 w-4" />
                                    )}
                                    {isPlaying ? "Parar" : "Ouvir Texto"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setSpeechRate(
                                            (prev) =>
                                                speedOptions[
                                                    (speedOptions.indexOf(
                                                        prev,
                                                    ) +
                                                        1) %
                                                        speedOptions.length
                                                ],
                                        )
                                    }
                                    disabled={isPlaying || isLoadingAudio}
                                >
                                    {speechRate.toFixed(2)}x
                                </Button>
                            </div>
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: phase.content,
                                }}
                            />
                        </div>
                    )}

                {phase.type === "quiz" && (
                    <div className="p-6 bg-card rounded-2xl shadow-sm border">
                        <div className="flex flex-col gap-4">
                            {questions.map((question, index) => (
                                <QuizQuestion
                                    key={question.id}
                                    question={question}
                                    onAnswer={handleCorrectAnswer}
                                    currentQuestionIndex={currentQuestionIndex}
                                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                                />
                            ))}
                        </div>
                        {quizCompleted && (
                            <div className="p-6 text-center bg-muted rounded-lg">
                                <h4 className="text-2xl font-bold text-foreground mb-3">
                                    Quiz Finalizado!
                                </h4>
                                <div className="flex items-center justify-center gap-2 text-lg text-foreground">
                                    <Clock className="h-6 w-6 text-primary" />
                                    <span>Tempo final:</span>
                                    <span className="font-bold text-primary text-xl">
                                        {formatTime(quizElapsedTime)}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Você já pode avançar para a próxima fase.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6">
                    <Button
                        onClick={navigateToPrevious}
                        disabled={!previousPhase}
                        variant="outline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleCompletePhase}
                            disabled={isSubmitting || phase.type === "quiz"}
                            className={`${phase.type === "quiz" ? "hidden" : ""}`}
                        >
                            {isSubmitting
                                ? "Processando..."
                                : nextPhase
                                  ? "Concluir e Próxima"
                                  : "Finalizar Módulo"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            onClick={navigateToNext}
                            disabled={!quizCompleted}
                            className={`${phase.type !== "quiz" ? "hidden" : ""}`}
                        >
                            {nextPhase
                                ? "Ir para Próxima Fase"
                                : "Finalizar Módulo"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {moduleCompleted && nextModule && (
                    <NextModuleCard
                        nextModule={nextModule}
                        onContinue={handleNextModule}
                        onBackToModules={handleBackToModules}
                    />
                )}
            </main>
        </div>
    );
}
