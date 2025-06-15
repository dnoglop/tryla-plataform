import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";

// Serviços
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
import { createJournalEntry } from "@/services/journalService";

// Hooks e Contextos
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";
import { usePhaseAudio } from "@/hooks/usePhaseAudio";

// Componentes
import { PhaseDetailSkeleton } from "@/components/phase-detail/PhaseDetailSkeleton";
import { PhaseHeader } from "@/components/phase-detail/PhaseHeader";
import { PhaseProgressCard } from "@/components/phase-detail/PhaseProgressCard";
import { AudioControls } from "@/components/phase-detail/AudioControls";
import { QuizContent } from "@/components/phase-detail/QuizContent";
import { NextModuleCard } from "@/components/phase-detail/NextModuleCard";
import { PhaseNavigation } from "@/components/phase-detail/PhaseNavigation";
import { PhaseJournal } from "@/components/phase-detail/PhaseJournal";

const calculateXpForTime = (seconds: number, questionCount: number) => {
    const secondsPerQuestion = seconds / (questionCount || 1);
    if (secondsPerQuestion <= 10) return 25;
    if (secondsPerQuestion <= 20) return 15;
    return 10;
};

export default function PhaseDetailPage() {
    const { moduleId, id: phaseId } = useParams<{ moduleId: string; id: string }>();
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
    
    const [journalNotes, setJournalNotes] = useState("");
    const [isJournalSaved, setIsJournalSaved] = useState(false);

    const { 
        isPlaying, isLoadingAudio, isPaused, speechRate, 
        handleReadContent: baseHandleReadContent, 
        handleSpeedChange: baseHandleSpeedChange, 
        handleResetAudio, stopAudio 
    } = usePhaseAudio();

    useEffect(() => {
        setJournalNotes("");
        setIsJournalSaved(false);
        setCurrentQuestionIndex(0);
        setQuizCompleted(false);
        setQuizStartTime(null);
    }, [phaseId]);

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                if (phaseId) {
                    const currentStatus = await getUserPhaseStatus(user.id, Number(phaseId));
                    if (currentStatus === "notStarted") {
                        updateUserPhaseStatus(user.id, Number(phaseId), "inProgress");
                    }
                }
            } else {
                navigate('/login');
            }
        };
        getUserId();
        return () => stopAudio();
    }, [phaseId, stopAudio, navigate]);

    const { data, isLoading, error } = useQuery({
        queryKey: ["phaseDetailData", phaseId, userId],
        queryFn: async () => {
            if (!phaseId || !moduleId || !userId) throw new Error("IDs não encontrados para a busca.");
            const [ phase, module, allPhases, questions, allModules, moduleProgress ] = await Promise.all([
                getPhaseById(Number(phaseId)),
                getModuleById(Number(moduleId)),
                getPhasesByModuleId(Number(moduleId)),
                getQuestionsByPhaseId(Number(phaseId)),
                getModules(),
                getModuleProgress(userId, Number(moduleId)),
            ]);
            return { phase, module, allPhases, questions, allModules, moduleProgress };
        },
        enabled: !!phaseId && !!moduleId && !!userId,
    });

    const journalMutation = useMutation({
        mutationFn: createJournalEntry,
        onSuccess: (data) => {
            if (data) {
                setIsJournalSaved(true);
                queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            }
        },
        onError: (err) => {
            console.error("Mutation error:", err);
        }
    });

    const { phase, module, allPhases = [], questions = [], allModules = [], moduleProgress = 0 } = data || {};

    useEffect(() => { if (phase?.content) setTextContent(phase.content) }, [phase?.content]);
    useEffect(() => { if (phase?.type === "quiz" && questions.length > 0 && !quizCompleted && !quizStartTime) setQuizStartTime(Date.now()) }, [phase?.type, questions.length, quizCompleted, quizStartTime]);
    useEffect(() => { if (error) { toast.error("Erro ao carregar dados da fase."); navigate(`/modulo/${moduleId}`); } }, [error, navigate, moduleId]);

    const currentPhaseIndex = allPhases.findIndex((p) => p.id === Number(phaseId));
    const previousPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;
    const currentModuleIndex = allModules.findIndex((m) => m.id === Number(moduleId));
    const nextModule = currentModuleIndex !== -1 && currentModuleIndex < allModules.length - 1 ? allModules[currentModuleIndex + 1] : null;

    const handleReadContent = () => baseHandleReadContent(textContent);
    const handleSpeedChange = () => baseHandleSpeedChange(textContent);

    const navigateToNext = () => {
        queryClient.invalidateQueries({ queryKey: ["moduleDetailData", Number(moduleId)] });
        if (nextPhase) {
            navigate(`/modulo/${moduleId}/fase/${nextPhase.id}`);
        } else {
            setModuleCompleted(true);
        }
    };
    const navigateToPrevious = () => { if (previousPhase) navigate(`/modulo/${moduleId}/fase/${previousPhase.id}`); };
    
    // --- FUNÇÃO DE SALVAMENTO ATUALIZADA ---
    const handleSaveJournal = async () => {
        // Trim para remover espaços em branco no início e no fim
        const notesToSave = journalNotes.trim();

        if (!notesToSave || !userId || !phase || !module) {
            toast.info("Escreva algo para salvar no seu diário.");
            return;
        }

        const payload = {
            user_id: userId,
            title: `Reflexões sobre: ${phase.name}`,
            content: notesToSave, // Usa a variável local 'notesToSave'
            emoji: '💡',
            module_id: module.id,
            phase_id: phase.id,
            is_favorite: false,
        };
        
        // PONTO CRÍTICO DE DEBUG: Verifique o console do seu navegador para ver este log.
        console.log("ENVIANDO PARA O DIÁRIO:", payload);

        // O 'await' garante que esperamos a conclusão da mutation antes de prosseguir
        await journalMutation.mutateAsync(payload);
    };

    const handleCompletePhase = async () => {
        if (isSubmitting || !userId || !phaseId || !moduleId) return;
        setIsSubmitting(true);
        
        try {
            // A verificação agora é mais robusta
            if (journalNotes.trim() && !isJournalSaved) {
                await handleSaveJournal();
            }

            const { xpFromPhase, xpFromModule } = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), false);
            
            if (xpFromPhase > 0 && xpFromModule > 0) {
                await showRewardModal({ xpAmount: xpFromPhase + xpFromModule, title: "Módulo Concluído!" });
            } else if (xpFromPhase > 0) {
                await showRewardModal({ xpAmount: xpFromPhase, title: "Fase Concluída!" });
            } else if (xpFromModule > 0) {
                await showRewardModal({ xpAmount: xpFromModule, title: "Módulo Concluído!" });
            }

            // Pequeno delay para garantir que a percepção de salvamento ocorra
            await new Promise((resolve) => setTimeout(resolve, 200)); 
            navigateToNext();
        } catch (err) {
            console.error("Erro ao completar a fase:", err);
            toast.error("Erro ao registrar seu progresso.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCorrectAnswer = async () => { /* ... seu código sem alterações ... */ };
    const handleNextModule = () => { if (nextModule) navigate(`/modulo/${nextModule.id}`); };
    const handleBackToModules = () => navigate("/modulos");

    if (isLoading) return <PhaseDetailSkeleton />;
    if (!phase || !module) return ( <div className="min-h-screen ..."> ... </div> );

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-background pb-24">
            <PhaseHeader module={module} moduleId={moduleId!} currentPhaseIndex={currentPhaseIndex} totalPhases={allPhases.length} />
            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <PhaseProgressCard phase={phase} moduleProgress={moduleProgress} />
                
                {phase.type === "video" && phase.video_url && ( <YoutubeEmbed videoId={phase.video_url} /> )}
                {(phase.type === "text" || phase.type === "challenge") && phase.content && (
                    <div className="card-trilha p-6">
                        <AudioControls isPlaying={isPlaying} isPaused={isPaused} isLoadingAudio={isLoadingAudio} speechRate={speechRate} onReadContent={handleReadContent} onSpeedChange={handleSpeedChange} onResetAudio={handleResetAudio} />
                        <div className="prose max-w-none prose-slate dark:prose-invert" dangerouslySetInnerHTML={{ __html: phase.content }} />
                    </div>
                )}
                {phase.type === "quiz" && ( <QuizContent questions={questions} currentQuestionIndex={currentQuestionIndex} quizCompleted={quizCompleted} quizStartTime={quizStartTime} quizElapsedTime={quizElapsedTime} currentQuestion={currentQuestion} onCorrectAnswer={handleCorrectAnswer} /> )}
                
                {(phase.type !== 'quiz' || quizCompleted) && (
                    <PhaseJournal
                        journalNotes={journalNotes}
                        setJournalNotes={setJournalNotes}
                        onSave={handleSaveJournal}
                        isSaving={journalMutation.isPending}
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

                {moduleCompleted && nextModule && ( <NextModuleCard nextModule={nextModule} onContinue={handleNextModule} onBackToModules={handleBackToModules} /> )}
                {moduleCompleted && !nextModule && ( <div className="mt-6 ..."> ... </div> )}
            </main>
        </div>
    );
}