
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";
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
} from "@/services/moduleService";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";
import { PhaseDetailSkeleton } from "@/components/phase-detail/PhaseDetailSkeleton";
import { PhaseHeader } from "@/components/phase-detail/PhaseHeader";
import { PhaseProgressCard } from "@/components/phase-detail/PhaseProgressCard";
import { AudioControls } from "@/components/phase-detail/AudioControls";
import { QuizContent } from "@/components/phase-detail/QuizContent";
import { NextModuleCard } from "@/components/phase-detail/NextModuleCard";
import { PhaseNavigation } from "@/components/phase-detail/PhaseNavigation";
import { usePhaseAudio } from "@/hooks/usePhaseAudio";

const calculateXpForTime = (s: number, q: number) => {
    const sPerQ = s / (q || 1);
    return sPerQ <= 10 ? 25 : sPerQ <= 20 ? 15 : 10;
};

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
    const [textContent, setTextContent] = useState<string | null>(null);
    
    const {
        isPlaying,
        isLoadingAudio,
        isPaused,
        speechRate,
        handleReadContent: baseHandleReadContent,
        handleSpeedChange: baseHandleSpeedChange,
        handleResetAudio,
        stopAudio,
    } = usePhaseAudio();

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

    const handleReadContent = () => baseHandleReadContent(textContent);
    const handleSpeedChange = () => baseHandleSpeedChange(textContent);

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
            <PhaseHeader 
                module={module}
                moduleId={moduleId!}
                currentPhaseIndex={currentPhaseIndex}
                totalPhases={allPhases.length}
            />

            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <PhaseProgressCard 
                    phase={phase}
                    moduleProgress={moduleProgress}
                />

                {phase.type === "video" && phase.video_url && (
                    <YoutubeEmbed videoId={phase.video_url} />
                )}

                {(phase.type === "text" || phase.type === "challenge") &&
                    phase.content && (
                        <div className="card-trilha p-6">
                            <AudioControls
                                isPlaying={isPlaying}
                                isPaused={isPaused}
                                isLoadingAudio={isLoadingAudio}
                                speechRate={speechRate}
                                onReadContent={handleReadContent}
                                onSpeedChange={handleSpeedChange}
                                onResetAudio={handleResetAudio}
                            />
                            <div
                                className="prose max-w-none prose-slate dark:prose-invert"
                                dangerouslySetInnerHTML={{
                                    __html: phase.content,
                                }}
                            />
                        </div>
                    )}

                {phase.type === "quiz" && (
                    <QuizContent
                        questions={questions}
                        currentQuestionIndex={currentQuestionIndex}
                        quizCompleted={quizCompleted}
                        quizStartTime={quizStartTime}
                        quizElapsedTime={quizElapsedTime}
                        currentQuestion={currentQuestion}
                        onCorrectAnswer={handleCorrectAnswer}
                    />
                )}

                <PhaseNavigation
                    previousPhase={previousPhase}
                    nextPhase={nextPhase}
                    phase={phase}
                    isSubmitting={isSubmitting}
                    quizCompleted={quizCompleted}
                    onNavigateToPrevious={navigateToPrevious}
                    onCompletePhase={handleCompletePhase}
                    onNavigateToNext={navigateToNext}
                />

                {moduleCompleted && nextModule && (
                    <NextModuleCard
                        nextModule={nextModule}
                        onContinue={handleNextModule}
                        onBackToModules={handleBackToModules}
                    />
                )}

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
