
// ARQUIVO: PhaseDetailPage.tsx
// VERSÃO MELHORADA COM NOVAS FUNCIONALIDADES

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
    Pause,
    Play,
    RotateCcw,
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
    Question,
    PhaseStatus,
} from "@/services/moduleService";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";

// Componentes e Funções Auxiliares
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

const formatTime = (s: number | null) =>
    s === null
        ? "00:00"
        : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const calculateXpForTime = (s: number, q: number) => {
    const sPerQ = s / (q || 1);
    return sPerQ <= 10 ? 25 : sPerQ <= 20 ? 15 : 10;
};

// Componente para mostrar o próximo módulo
const NextModuleCard = ({
    nextModule,
    onContinue,
    onBackToModules,
}: {
    nextModule: Module;
    onContinue: () => void;
    onBackToModules: () => void;
}) => (
    <div className="mt-6 p-6 bg-gradient-to-r from-accent to-accent/80 rounded-2xl border border-border">
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
        <div className="flex gap-3">
            <Button
                onClick={onContinue}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
                Seguir para o Próximo Módulo
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
                onClick={onBackToModules}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
            >
                <Home className="mr-2 h-4 w-4" />
                Voltar para as Trilhas
            </Button>
        </div>
    </div>
);

export default function PhaseDetailPage() {
    const { moduleId, id: phaseId } = useParams<{
        moduleId: string;
        id: string;
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
    const [lastReadPosition, setLastReadPosition] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [textContent, setTextContent] = useState<string | null>(null);
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
            
            console.log("Loading phase data:", { phaseId, moduleId, userId });
            
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
            
            console.log("Phase data loaded:", { phase, module, allPhases, questions, moduleProgress });
            
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

    useEffect(() => {
        if (phase?.content) {
            setTextContent(phase.content);
        }
    }, [phase?.content]);

    useEffect(() => {
        if (
            phase?.type === "quiz" &&
            questions.length > 0 &&
            !quizCompleted &&
            !quizStartTime
        ) {
            setQuizStartTime(Date.now());
        }
    }, [phase?.type, questions.length, quizCompleted, quizStartTime]);

    useEffect(() => {
        if (error) {
            console.error("Error loading phase data:", error);
            toast.error("Erro ao carregar dados da fase.");
            navigate(`/modulo/${moduleId}`);
        }
    }, [error, navigate, moduleId]);

    // Monitora quando o áudio termina para resetar a posição
    useEffect(() => {
        if (!isPlaying && !isPaused) {
            setLastReadPosition(0);
        }
    }, [isPlaying, isPaused]);

    const currentPhaseIndex = allPhases.findIndex(
        (p) => p.id === Number(phaseId),
    );
    const previousPhase =
        currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase =
        currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1
            ? allPhases[currentPhaseIndex + 1]
            : null;

    // Encontrar o próximo módulo
    const currentModuleIndex = allModules.findIndex(
        (m) => m.id === Number(moduleId),
    );
    const nextModule =
        currentModuleIndex !== -1 && currentModuleIndex < allModules.length - 1
            ? allModules[currentModuleIndex + 1]
            : null;

    const getTextFromPosition = (text: string, position: number): string => {
        const words = text.split(' ');
        return words.slice(position).join(' ');
    };

    const handleReadContent = () => {
        console.log("Text-to-speech button clicked, isPlaying:", isPlaying);
        if (!textContent) {
            console.log("No text content available");
            return;
        }
        
        if (isPlaying) {
            console.log("Stopping audio");
            stopAudio();
            setIsPaused(true);
        } else {
            console.log("Starting audio with rate:", speechRate, "from position:", lastReadPosition);
            const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            // Se foi pausado, continua de onde parou, senão começa do início
            const textToRead = isPaused ? getTextFromPosition(cleanText, lastReadPosition) : cleanText;
            
            if (!isPaused) {
                setLastReadPosition(0);
            }
            
            playText(textToRead, { lang: 'pt-BR', rate: speechRate });
            setIsPaused(false);
        }
    };

    const handleSpeedChange = () => {
        console.log("Speed change requested");
        const currentIndex = speedOptions.indexOf(speechRate);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        const newSpeed = speedOptions[nextIndex];
        console.log("Speed changed to:", newSpeed);
        setSpeechRate(newSpeed);
        
        if (isPlaying && textContent) {
            stopAudio();
            setTimeout(() => {
                const cleanText = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                const textToRead = getTextFromPosition(cleanText, lastReadPosition);
                playText(textToRead, { lang: 'pt-BR', rate: newSpeed });
            }, 100);
        }
        
        toast.info(`Velocidade alterada para ${newSpeed}x`);
    };

    const handleResetAudio = () => {
        stopAudio();
        setLastReadPosition(0);
        setIsPaused(false);
        toast.info("Posição do áudio resetada");
    };

    const navigateToNext = () => {
        queryClient.invalidateQueries({
            queryKey: ["moduleDetailData", Number(moduleId)],
        });
        if (nextPhase) {
            navigate(`/modulo/${moduleId}/fase/${nextPhase.id}`);
        } else {
            setModuleCompleted(true);
        }
    };

    const navigateToPrevious = () => {
        if (previousPhase) {
            navigate(`/modulo/${moduleId}/fase/${previousPhase.id}`);
        }
    };

    const handleCompletePhase = async () => {
        if (isSubmitting || !userId || !phaseId || !moduleId) return;
        setIsSubmitting(true);
        try {
            const { xpFromPhase, xpFromModule } = await completePhaseAndAwardXp(
                userId,
                Number(phaseId),
                Number(moduleId),
                false,
            );

            if (xpFromPhase > 0 && xpFromModule > 0) {
                const totalXp = xpFromPhase + xpFromModule;
                await showRewardModal({
                    xpAmount: totalXp,
                    title: "Módulo Concluído!",
                });
            } else if (xpFromPhase > 0) {
                await showRewardModal({
                    xpAmount: xpFromPhase,
                    title: "Fase Concluída!",
                });
            } else if (xpFromModule > 0) {
                await showRewardModal({
                    xpAmount: xpFromModule,
                    title: "Módulo Concluído!",
                });
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            navigateToNext();
        } catch (err) {
            console.error("Erro ao completar a fase:", err);
            toast.error("Erro ao registrar seu progresso.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCorrectAnswer = async () => {
        if (!userId || !phaseId || !moduleId) return;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        if (isLastQuestion) {
            setQuizCompleted(true);
            const endTime = Date.now();
            const elapsed = quizStartTime
                ? Math.round((endTime - quizStartTime) / 1000)
                : 0;
            setQuizElapsedTime(elapsed);

            const xpFromTime = calculateXpForTime(elapsed, questions.length);
            const quizXpAwarded = await awardQuizXp(
                userId,
                Number(phaseId),
                xpFromTime,
            );

            if (quizXpAwarded && xpFromTime > 0) {
                await showRewardModal({
                    xpAmount: xpFromTime,
                    title: "Quiz Finalizado!",
                });
            }

            const { xpFromModule } = await completePhaseAndAwardXp(
                userId,
                Number(phaseId),
                Number(moduleId),
                true,
            );

            if (xpFromModule > 0) {
                await showRewardModal({
                    xpAmount: xpFromModule,
                    title: "Módulo Concluído!",
                });
            }

            queryClient.invalidateQueries({
                queryKey: ["moduleDetailData", Number(moduleId)],
            });
        } else {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
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
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-lg max-w-md mx-4">
                    <div className="mb-4">
                        <CheckCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">
                            Conteúdo não encontrado
                        </h2>
                        <p className="text-muted-foreground mb-4">
                            A fase ou módulo solicitado não foi encontrado.
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Phase ID: {phaseId}</p>
                            <p>Module ID: {moduleId}</p>
                        </div>
                    </div>
                    <Button onClick={() => navigate("/modulos")} className="w-full">
                        <Home className="mr-2 h-4 w-4" />
                        Voltar aos Módulos
                    </Button>
                </div>
            </div>
        );

    const currentQuestion = questions[currentQuestionIndex];

    console.log("Rendering phase detail:", {
        phase: phase?.name,
        module: module?.name,
        phaseType: phase?.type,
        questionsCount: questions.length,
        moduleProgress
    });

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header melhorado */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/modulo/${moduleId}`)}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-md transition-transform hover:scale-110 active:scale-95 border border-border"
                            >
                                <ArrowLeft className="h-5 w-5 text-foreground" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground truncate">
                                    {module.name}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Fase {currentPhaseIndex + 1} de {allPhases.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                {/* Card principal da fase */}
                <div className="card-trilha p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                                {phase.name}
                            </h2>
                            {phase.description && (
                                <p className="text-muted-foreground mt-2 text-base">
                                    {phase.description}
                                </p>
                            )}
                        </div>

                        {/* Gráfico circular de progresso */}
                        <div className="flex-shrink-0">
                            <div className="relative flex items-center justify-center">
                                <svg
                                    width={70}
                                    height={70}
                                    className="transform -rotate-90"
                                >
                                    {/* Background circle */}
                                    <circle
                                        cx={35}
                                        cy={35}
                                        r={28}
                                        stroke="hsl(var(--muted))"
                                        strokeWidth={7}
                                        fill="none"
                                    />
                                    {/* Progress circle */}
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
                                {/* Percentage text */}
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
                        <div className="card-trilha p-6">
                            {/* Controles de áudio melhorados */}
                            <div className="flex justify-end items-center gap-3 mb-6 p-3 bg-accent rounded-lg">
                                <div className="text-xs text-muted-foreground">
                                    Áudio:
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReadContent}
                                    disabled={isLoadingAudio}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {isPlaying ? (
                                        <Pause className="mr-2 h-4 w-4" />
                                    ) : isPaused ? (
                                        <Play className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Volume2 className="mr-2 h-4 w-4" />
                                    )}
                                    {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Ouvir Texto"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSpeedChange}
                                    className="min-w-[60px]"
                                >
                                    {speechRate.toFixed(2)}x
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetAudio}
                                    disabled={!isPaused && !isPlaying}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                            <div
                                className="prose max-w-none prose-slate dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                    __html: phase.content,
                                }}
                            />
                        </div>
                    )}

                {phase.type === "quiz" && (
                    <div className="card-trilha p-6">
                        {isLoading && <p className="text-muted-foreground">Carregando perguntas...</p>}
                        {questions.length > 0 &&
                            !quizCompleted &&
                            currentQuestion && (
                                <div>
                                    <div className="flex justify-between text-sm text-muted-foreground mb-4">
                                        <span>
                                            Pergunta {currentQuestionIndex + 1}{" "}
                                            de {questions.length}
                                        </span>
                                        {quizStartTime && (
                                            <span className="text-primary flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatTime(
                                                    Math.round(
                                                        (Date.now() -
                                                            quizStartTime) /
                                                            1000,
                                                    ),
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="progress-bar mb-6">
                                        <div
                                            className="progress-value"
                                            style={{
                                                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <QuizQuestion
                                        key={currentQuestion.id}
                                        questionId={currentQuestion.id}
                                        question={currentQuestion.question}
                                        options={
                                            Array.isArray(
                                                currentQuestion.options,
                                            )
                                                ? currentQuestion.options
                                                : []
                                        }
                                        correctAnswer={
                                            currentQuestion.correct_answer
                                        }
                                        tip={
                                            currentQuestion.tips_question ||
                                            null
                                        }
                                        onCorrectAnswer={handleCorrectAnswer}
                                    />
                                </div>
                            )}
                        {quizCompleted && (
                            <div className="p-6 text-center bg-accent rounded-lg">
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

                {/* Navegação melhorada */}
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
                    {/* Botão Voltar */}
                    <Button
                        onClick={navigateToPrevious}
                        disabled={!previousPhase}
                        variant="outline"
                        className={`${!previousPhase ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>

                    {/* Botões de Ação centralizados */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleCompletePhase}
                            disabled={isSubmitting || phase.type === "quiz"}
                            className={`btn-trilha ${phase.type === "quiz" ? "hidden" : ""}`}
                        >
                            {isSubmitting
                                ? "Processando..."
                                : nextPhase
                                  ? "Concluir e Próxima"
                                  : "Finalizar Módulo"}{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            onClick={navigateToNext}
                            disabled={!quizCompleted}
                            className={`btn-trilha ${phase.type !== "quiz" ? "hidden" : ""}`}
                        >
                            {nextPhase
                                ? "Próxima Fase"
                                : "Finalizar Módulo"}{" "}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Card do Próximo Módulo */}
                {moduleCompleted && nextModule && (
                    <NextModuleCard
                        nextModule={nextModule}
                        onContinue={handleNextModule}
                        onBackToModules={handleBackToModules}
                    />
                )}

                {/* Mensagem quando não há próximo módulo */}
                {moduleCompleted && !nextModule && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-2xl border border-green-500/20 text-center">
                        <div className="mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-foreground mb-2">
                                Parabéns! 🎉
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Você concluiu todas as trilhas disponíveis!
                            </p>
                        </div>
                        <Button
                            onClick={handleBackToModules}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Voltar para as Trilhas
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
