import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Home, Quote as QuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import 'react-quill/dist/quill.snow.css';

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
    Phase,
    Module,
    // CORREÇÃO: Importando debugXpState
    debugXpState
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

// Lembre-se de adicionar 'quote' e 'quote_author' nas chamadas de serviço (select)
// como getPhaseById e getPhasesByModuleId

export default function PhaseDetailPage() {
    const { moduleId, id: phaseId } = useParams<{ moduleId: string; id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showRewardModal } = useRewardModal();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [moduleCompleted, setModuleCompleted] = useState(false);
    const [journalNotes, setJournalNotes] = useState("");
    const [isJournalSaved, setIsJournalSaved] = useState(false);

    // Estados específicos de quiz
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [quizElapsedTime, setQuizElapsedTime] = useState<number | null>(null);

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
        setModuleCompleted(false);
        handleResetAudio();
    }, [phaseId, handleResetAudio]);

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
                toast.success("Suas reflexões foram salvas no diário!");
                queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
            }
        },
        onError: (err) => toast.error("Erro ao salvar no diário."),
    });

    const { phase, module, allPhases = [], questions = [], allModules = [], moduleProgress = 0 } = data || {};

    useEffect(() => { if (phase?.type === "quiz" && questions.length > 0 && !quizCompleted && !quizStartTime) setQuizStartTime(Date.now()) }, [phase?.type, questions.length, quizCompleted, quizStartTime]);
    useEffect(() => { if (error) { toast.error("Erro ao carregar dados da fase."); navigate(`/modulo/${moduleId}`); } }, [error, navigate, moduleId]);

    const currentPhaseIndex = allPhases.findIndex((p) => p.id === Number(phaseId));
    const previousPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;
    const currentModuleIndex = allModules.findIndex((m) => m.id === Number(moduleId));
    const nextModule = currentModuleIndex !== -1 && currentModuleIndex < allModules.length - 1 ? allModules[currentModuleIndex + 1] : null;

    const handleReadContent = () => baseHandleReadContent(phase?.content);

    const navigateToNext = () => {
        if (nextPhase) {
            navigate(`/modulo/${moduleId}/fase/${nextPhase.id}`);
        } else {
            setModuleCompleted(true);
        }
        queryClient.invalidateQueries({ queryKey: ["moduleDetailData", Number(moduleId)] });
    };
    const navigateToPrevious = () => { if (previousPhase) navigate(`/modulo/${moduleId}/fase/${previousPhase.id}`); };
    
    const handleSaveJournal = async () => {
        const notesToSave = journalNotes.trim();
        if (!notesToSave || !userId || !phase || !module) {
            toast.info("Escreva algo para salvar no seu diário.");
            return;
        }
        await journalMutation.mutateAsync({
            user_id: userId,
            title: `Reflexões sobre: ${phase.name}`,
            content: notesToSave,
            emoji: '💡',
            module_id: module.id,
            phase_id: phase.id,
            is_favorite: false,
        });
    };

    const getUserTotalXp = async (userId: string): Promise<number> => {
        try {
            const { data, error } = await supabase
                .from('profiles') // Confirme se este é o nome correto da sua tabela
                .select('xp')     // Confirme se este é o nome correto da sua coluna de XP
                .eq('id', userId)
                .single();
                
            if (error) throw error;
            return data?.xp || 0;
        } catch (error) {
            console.error('Erro ao buscar XP do usuário:', error);
            return 0;
        }
    };
    // TRECHO CORRIGIDO DA FUNÇÃO handleCompletePhase no PhaseDetailPage

    const handleCompletePhase = async () => {
        if (isSubmitting || !userId || !phaseId || !moduleId) return;
        
        setIsSubmitting(true);
        
        try {
            if (journalNotes.trim() && !isJournalSaved) {
                await handleSaveJournal();
            }
            
            const isQuiz = phase?.type === 'quiz';
            
            // 1. Capturar o estado ANTES
            const userXpBefore = await getUserTotalXp(userId);
            
            // 2. Chamar a RPC
            const result = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), isQuiz);
            console.log('✅ Resultado da RPC:', result);
    
            // 3. Tentar ler o resultado da RPC (com os nomes corretos)
            let xpFromPhase = result.xp_ganho_fase || 0;
            let xpFromModule = result.xp_ganho_modulo || 0;
            let totalXp = xpFromPhase + xpFromModule;
            
            // 4. Se a RPC falhou em retornar o XP, usar o fallback
            if (totalXp === 0) {
                console.log('🔍 RPC retornou 0. Usando fallback de verificação de XP...');
                const userXpAfter = await getUserTotalXp(userId);
                const xpDifference = userXpAfter - userXpBefore;
                
                if (xpDifference > 0) {
                    console.log('🔧 Diferença de XP detectada:', xpDifference);
                    totalXp = xpDifference;
                    // Simples heurística: se a diferença for > 5, provavelmente inclui o bônus de módulo
                    if (xpDifference > 5) {
                        xpFromModule = xpDifference - 5;
                        xpFromPhase = 5;
                    } else {
                        xpFromPhase = xpDifference;
                        xpFromModule = 0;
                    }
                }
            }
            
            console.log('📊 XP final para exibição:', { xpFromPhase, xpFromModule, totalXp });
            
            // 5. Mostrar o modal se XP foi ganho
            if (totalXp > 0) {
                const modalTitle = xpFromModule > 0 ? "Módulo Concluído!" : "Fase Concluída!";
                await showRewardModal({ xpAmount: totalXp, title: modalTitle });
            } else {
                toast.success("Progresso salvo!");
            }
            
            // 6. Invalidar queries e navegar
            queryClient.invalidateQueries({ queryKey: ['phaseDetailData', 'moduleDetailData', 'userProfile'] });
            
            navigateToNext();
            
        } catch (err) {
            console.error('❌ Erro crítico ao completar fase:', err);
            toast.error("Erro ao registrar seu progresso.");
        } finally {
            setIsSubmitting(false);
        }
    };

    
    const handleCorrectAnswer = async () => {
        if (currentQuestionIndex < questions.length - 1) {
            // Ainda há mais perguntas
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Quiz completado - última pergunta respondida corretamente
            setQuizCompleted(true);
            setQuizElapsedTime(Date.now() - (quizStartTime || Date.now()));
            
            // CORREÇÃO: Apenas marcar como completado, não completar automaticamente
            // O usuário deve clicar no botão "Completar Fase" após ver o resultado
        }
    };

    const handleNextModule = () => { if (nextModule) navigate(`/modulo/${nextModule.id}`); };
    const handleBackToModules = () => navigate("/modulos");

    if (isLoading) return <PhaseDetailSkeleton />;
    if (!phase || !module) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <p className="mb-4">Oops! Não foi possível encontrar os dados desta fase.</p>
            <Button onClick={() => navigate('/modulos')}>Voltar para Módulos</Button>
        </div>
    );

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-background pb-24">
            <PhaseHeader module={module} moduleId={moduleId!} currentPhaseIndex={currentPhaseIndex} totalPhases={allPhases.length} />
            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <PhaseProgressCard phase={phase} moduleProgress={moduleProgress} />
                
                {/* LÓGICA DE RENDERIZAÇÃO DE CONTEÚDO */}

                {(phase.type === "text" || phase.type === "challenge") && (
                    <div className="card-trilha p-6 space-y-6">
                        {/* 1. TEXTO PRINCIPAL (se existir) */}
                        {phase.content && (
                            <div>
                                <AudioControls 
                                    isPlaying={isPlaying} 
                                    isPaused={isPaused} 
                                    isLoadingAudio={isLoadingAudio} 
                                    speechRate={speechRate} 
                                    onReadContent={handleReadContent} 
                                    onSpeedChange={() => baseHandleSpeedChange(phase?.content)}
                                    onResetAudio={handleResetAudio} 
                                />
                                <div className="prose max-w-none prose-slate dark:prose-invert mt-4" dangerouslySetInnerHTML={{ __html: phase.content }} />
                            </div>
                        )}

                        {/* 2. FRASE DE DESTAQUE (se existir) */}
                        {phase.quote && (
                            <div className="my-6 p-6 border-l-4 border-primary bg-muted/40 rounded-r-lg">
                                <QuoteIcon className="h-6 w-6 text-primary/50 mb-2" aria-hidden="true" />
                                <blockquote className="text-xl italic font-medium text-foreground">
                                    <p>"{phase.quote}"</p>
                                </blockquote>
                                {phase.quote_author && (
                                    <cite className="mt-4 block text-right font-semibold not-italic">
                                        — {phase.quote_author}
                                    </cite>
                                )}
                            </div>
                        )}

                        {/* 3. VÍDEO (se existir) */}
                        {phase.video_url && (
                            <div className="mt-4 rounded-lg overflow-hidden">
                               <YoutubeEmbed videoId={phase.video_url} />
                            </div>
                        )}
                    </div>
                )}
                
                {phase.type === "video" && phase.video_url && (
                    <div className="rounded-lg overflow-hidden">
                        <YoutubeEmbed videoId={phase.video_url} />
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
                
                {moduleCompleted && !nextModule && (
                    <div className="mt-6 text-center p-8 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold">Parabéns!</h2>
                        <p className="mt-2 text-muted-foreground">Você concluiu todos os módulos disponíveis. Excelente trabalho!</p>
                        <Button onClick={handleBackToModules} className="mt-6">Voltar para a tela inicial</Button>
                    </div>
                )}
            </main>
        </div>
    );
}