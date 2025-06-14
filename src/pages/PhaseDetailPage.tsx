
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
    <div className="min-h-screen bg-slate-50 animate-pulse">
        <header className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                <Skeleton className="h-7 w-48 bg-slate-200" />
            </div>
        </header>
        <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-200" />
            <Skeleton className="aspect-video w-full rounded-2xl bg-slate-200" />
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
    <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
        <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-orange-200 text-2xl">
                {nextModule.emoji || "📚"}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                    Próxima Missão
                </h3>
                <h4 className="text-xl font-semibold text-orange-600 mb-2">
                    {nextModule.name}
                </h4>
                <p className="text-sm text-slate-600">
                    {nextModule.description}
                </p>
            </div>
        </div>
        <div className="flex gap-3">
            <Button
                onClick={onContinue}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
                Seguir para o Próximo Módulo
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
                onClick={onBackToModules}
                variant="outline"
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
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
            <div className="p-4 text-center">
                <p className="text-red-600 mb-4">Fase ou Módulo não encontrado.</p>
                <p className="text-sm text-gray-600">Phase ID: {phaseId}, Module ID: {moduleId}</p>
                <Button onClick={() => navigate("/modulos")} className="mt-4">
                    Voltar aos Módulos
                </Button>
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
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="p-4 sm:p-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/modulo/${moduleId}`)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 truncate">
                                {module.name}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                                {phase.name}
                            </h2>
                            {phase.description && (
                                <p className="text-slate-600 mt-2 text-base">
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
                                        stroke="rgb(226 232 240)"
                                        strokeWidth={7}
                                        fill="none"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx={35}
                                        cy={35}
                                        r={28}
                                        stroke="rgb(249 115 22)"
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
                                    <span className="text-sm font-bold text-slate-700">
                                        {Math.round(moduleProgress)}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-center text-slate-500 mt-2 font-medium">
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
                        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">
                            <div className="flex justify-end items-center gap-4 mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReadContent}
                                    disabled={isLoadingAudio}
                                    className="text-white bg-orange-500 hover:bg-orange-600"
                                >
                                    {isPlaying ? (
                                        <VolumeX className="mr-2 h-4 w-4" />
                                    ) : (
                                        <Volume2 className="mr-2 h-4 w-4" />
                                    )}
                                    {isPlaying ? "Pausar" : isPaused ? "Continuar" : "Ouvir Texto"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSpeedChange}
                                    disabled={isPlaying || isLoadingAudio}
                                >
                                    {speechRate.toFixed(2)}x
                                </Button>
                            </div>
                            <div
                                className="prose max-w-none prose-slate"
                                dangerouslySetInnerHTML={{
                                    __html: phase.content,
                                }}
                            />
                        </div>
                    )}

                {phase.type === "quiz" && (
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">
                        {isLoading && <p>Carregando perguntas...</p>}
                        {questions.length > 0 &&
                            !quizCompleted &&
                            currentQuestion && (
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>
                                            Pergunta {currentQuestionIndex + 1}{" "}
                                            de {questions.length}
                                        </span>
                                        {quizStartTime && (
                                            <span className="text-orange-500">
                                                ⏱️{" "}
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
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                                        <div
                                            className="bg-orange-500 h-2.5 rounded-full"
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
                            <div className="p-6 text-center bg-slate-50 rounded-lg">
                                <h4 className="text-2xl font-bold text-slate-800 mb-3">
                                    Quiz Finalizado!
                                </h4>
                                <div className="flex items-center justify-center gap-2 text-lg text-slate-700">
                                    <Clock className="h-6 w-6 text-orange-500" />
                                    <span>Tempo final:</span>
                                    <span className="font-bold text-orange-500 text-xl">
                                        {formatTime(quizElapsedTime)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-2">
                                    Você já pode avançar para a próxima fase.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
                    {/* Botão Voltar */}
                    <Button
                        onClick={navigateToPrevious}
                        disabled={!previousPhase}
                        variant="outline"
                        className={`${!previousPhase ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>

                    {/* Botões de Ação */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleCompletePhase}
                            disabled={isSubmitting || phase.type === "quiz"}
                            className={`text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 ${phase.type === "quiz" ? "hidden" : ""}`}
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
                            className={`text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 ${phase.type !== "quiz" ? "hidden" : ""}`}
                        >
                            {nextPhase
                                ? "Ir para Próxima Fase"
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
                    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200 text-center">
                        <div className="mb-4">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                Parabéns! 🎉
                            </h3>
                            <p className="text-slate-600 mb-4">
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
