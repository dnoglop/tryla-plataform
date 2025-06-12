// ARQUIVO: PhaseDetailPage.tsx
// CÓDIGO COMPLETO E CORRIGIDO - MODAL XP E TEMPO DO QUIZ

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Volume2, VolumeX, CheckCircle, Clock } from "lucide-react";
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
    Phase, 
    Module, 
    Question,
    PhaseStatus
} from "@/services/moduleService";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";

// Componentes e Funções Auxiliares (sem alterações)
const PhaseDetailSkeleton = () => (
    <div className="min-h-screen bg-slate-50 animate-pulse">
        <header className="p-4 sm:p-6"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full bg-slate-200" /><Skeleton className="h-7 w-48 bg-slate-200" /></div></header>
        <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6"><Skeleton className="h-28 w-full rounded-2xl bg-slate-200" /><Skeleton className="aspect-video w-full rounded-2xl bg-slate-200" /></main>
    </div>
);
const formatTime = (s: number | null) => s === null ? "00:00" : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const calculateXpForTime = (s: number, q: number) => { const sPerQ = s / (q || 1); return sPerQ <= 10 ? 25 : sPerQ <= 20 ? 15 : 10; };

export default function PhaseDetailPage() {
    const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showRewardModal } = useRewardModal();
    const [userId, setUserId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
    const [quizElapsedTime, setQuizElapsedTime] = useState<number | null>(null);
    const { isPlaying, isLoading: isLoadingAudio, playText, stopAudio } = useTextToSpeech();
    const [speechRate, setSpeechRate] = useState(1.15);
    const speedOptions = [1.15, 1.25, 1.5];
    
    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                if (phaseId) {
                    const currentStatus = await getUserPhaseStatus(user.id, Number(phaseId));
                    if (currentStatus === 'notStarted') {
                        updateUserPhaseStatus(user.id, Number(phaseId), 'inProgress');
                    }
                }
            }
        };
        getUserId();
        return () => { stopAudio(); };
    }, [phaseId, stopAudio]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['phaseDetailData', phaseId],
        queryFn: async () => {
            if (!phaseId || !moduleId) throw new Error("IDs não encontrados.");
            const pId = Number(phaseId); const mId = Number(moduleId);
            const [phase, module, allPhases, questions] = await Promise.all([
                getPhaseById(pId), getModuleById(mId), getPhasesByModuleId(mId), getQuestionsByPhaseId(pId)
            ]);
            return { phase, module, allPhases, questions };
        },
        enabled: !!phaseId && !!moduleId,
    });
    
    const { phase, module, allPhases = [], questions = [] } = data || {};
    
    // CORRIGIDO: Inicia o tempo do quiz apenas quando as perguntas são carregadas E o quiz não foi concluído
    useEffect(() => {
        if (phase?.type === 'quiz' && questions.length > 0 && !quizCompleted && !quizStartTime) {
            console.log('Iniciando cronômetro do quiz:', Date.now());
            setQuizStartTime(Date.now());
        }
    }, [phase?.type, questions.length, quizCompleted, quizStartTime]);

    useEffect(() => {
        if(error) {
            toast.error("Erro ao carregar dados da fase.");
            navigate(`/modulo/${moduleId}`);
        }
    }, [error, navigate, moduleId]);

    const currentPhaseIndex = allPhases.findIndex(p => p.id === Number(phaseId));
    const nextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;

    // --- FUNÇÕES RESTAURADAS ---
    const handleReadContent = () => {
        if (!phase?.content) return;
        if (isPlaying) stopAudio(); else playText(phase.content.replace(/<[^>]*>?/gm, ' '), { lang: 'pt-BR', rate: speechRate });
    };
    
    const handleSpeedChange = () => {
        const currentIndex = speedOptions.indexOf(speechRate);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        const newSpeed = speedOptions[nextIndex];
        setSpeechRate(newSpeed);
        toast.info(`Velocidade alterada para ${newSpeed}x`);
    };
    // --- FIM DAS FUNÇÕES RESTAURADAS ---

    const navigateToNext = () => {
        queryClient.invalidateQueries({ queryKey: ['moduleDetailData', Number(moduleId)] });
        if (nextPhase) {
            navigate(`/fase/${moduleId}/${nextPhase.id}`);
        } else {
            toast.success("Módulo finalizado!", { description: "Parabéns por mais essa conquista!", icon: <CheckCircle className="text-green-500"/> });
            navigate(`/modulo/${moduleId}`);
        }
    };

    // CORRIGIDO: Garantir que o modal XP seja exibido para fases normais
    const handleCompletePhase = async () => {
        if (isSubmitting || !userId || !phaseId || !moduleId) return;
        setIsSubmitting(true);
        try {
            console.log('Completando fase:', phaseId);
            const { xpFromPhase, xpFromModule } = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), false);
            
            console.log('XP recebido da fase:', xpFromPhase, 'XP do módulo:', xpFromModule);
            
            // SEMPRE mostra o modal se XP foi concedido
            if (xpFromPhase > 0) {
                console.log('Mostrando modal de XP da fase');
                await showRewardModal({ xpAmount: xpFromPhase, title: "Fase Concluída!" });
            }
            if (xpFromModule > 0) {
                console.log('Mostrando modal de XP do módulo');
                await showRewardModal({ xpAmount: xpFromModule, title: "Módulo Concluído!" });
            }

            navigateToNext();

        } catch (err) { 
            console.error("Erro ao completar a fase:", err);
            toast.error("Erro ao registrar seu progresso."); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // CORRIGIDO: Garantir que o modal XP seja exibido para quizzes e calcular tempo corretamente
    const handleCorrectAnswer = async () => {
        if (!userId || !phaseId || !moduleId) return;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        
        if (isLastQuestion) {
            console.log('Última pergunta respondida, finalizando quiz');
            setQuizCompleted(true);
            
            // CORRIGIDO: Calcular tempo corretamente
            const endTime = Date.now();
            const elapsed = quizStartTime ? Math.round((endTime - quizStartTime) / 1000) : 0;
            console.log('Tempo decorrido no quiz:', elapsed, 'segundos');
            setQuizElapsedTime(elapsed);
            
            // Conceder XP baseado no tempo
            const xpFromTime = calculateXpForTime(elapsed, questions.length);
            console.log('XP calculado pelo tempo:', xpFromTime);
            
            const quizXpAwarded = await awardQuizXp(userId, Number(phaseId), xpFromTime);
            console.log('XP do quiz foi concedido:', quizXpAwarded);
            
            // SEMPRE mostra o modal se XP foi concedido
            if (quizXpAwarded && xpFromTime > 0) {
                console.log('Mostrando modal de XP do quiz');
                await showRewardModal({ xpAmount: xpFromTime, title: "Quiz Finalizado!" });
            }

            // Completar a fase (quiz) - só concede XP do módulo se aplicável
            const { xpFromModule } = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), true);
            console.log('XP do módulo após quiz:', xpFromModule);
            
            if (xpFromModule > 0) {
                console.log('Mostrando modal de XP do módulo');
                await showRewardModal({ xpAmount: xpFromModule, title: "Módulo Concluído!" });
            }
            
            queryClient.invalidateQueries({ queryKey: ['moduleDetailData', Number(moduleId)] });

        } else {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    if (isLoading) return <PhaseDetailSkeleton />;
    if (!phase || !module) return <div className="p-4 text-center">Fase ou Módulo não encontrado.</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="p-4 sm:p-6"><div className="flex items-center gap-4 max-w-4xl mx-auto"><button onClick={() => navigate(`/modulo/${moduleId}`)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95"><ArrowLeft className="h-5 w-5 text-gray-600" /></button><h1 className="text-xl font-bold text-slate-800 truncate">{module.name}</h1></div></header>
            
            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50"><h2 className="text-2xl md:text-3xl font-bold text-slate-800">{phase.name}</h2>{phase.description && <p className="text-slate-600 mt-2 text-base">{phase.description}</p>}</div>
                {phase.type === "video" && phase.video_url && <YoutubeEmbed videoId={phase.video_url} />}
                {(phase.type === "text" || phase.type === "challenge") && phase.content && (<div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50"><div className="flex justify-end items-center gap-4 mb-4"><Button variant="outline" size="sm" onClick={handleReadContent} disabled={isLoadingAudio} className="text-white bg-orange-500 hover:bg-orange-600">{isPlaying ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}{isPlaying ? 'Parar' : 'Ouvir Texto'}</Button><Button variant="outline" size="sm" onClick={handleSpeedChange} disabled={isPlaying || isLoadingAudio}>{speechRate.toFixed(2)}x</Button></div><div className="prose max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: phase.content }} /></div>)}
                {phase.type === "quiz" && (<div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">{isLoading && <p>Carregando perguntas...</p>}{questions.length > 0 && !quizCompleted && currentQuestion && (<div><div className="flex justify-between text-sm text-gray-600 mb-2"><span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>{quizStartTime && <span className="text-orange-500">⏱️ {formatTime(Math.round((Date.now() - quizStartTime) / 1000))}</span>}</div><div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div></div><QuizQuestion key={currentQuestion.id} questionId={currentQuestion.id} question={currentQuestion.question} options={Array.isArray(currentQuestion.options) ? currentQuestion.options : []} correctAnswer={currentQuestion.correct_answer} tip={currentQuestion.tips_question || null} onCorrectAnswer={handleCorrectAnswer} /></div>)}{quizCompleted && (<div className="p-6 text-center bg-slate-50 rounded-lg"><h4 className="text-2xl font-bold text-slate-800 mb-3">Quiz Finalizado!</h4><div className="flex items-center justify-center gap-2 text-lg text-slate-700"><Clock className="h-6 w-6 text-orange-500" /><span>Tempo final:</span><span className="font-bold text-orange-500 text-xl">{formatTime(quizElapsedTime)}</span></div><p className="text-sm text-slate-500 mt-2">Você já pode avançar para a próxima fase.</p></div>)}</div>)}
                
                <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                    <Button 
                        onClick={handleCompletePhase} 
                        disabled={isSubmitting || phase.type === 'quiz'} 
                        className={`w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 ${phase.type === 'quiz' ? 'hidden' : ''}`}
                    >
                        {isSubmitting ? 'Processando...' : (nextPhase ? "Concluir e Próxima" : "Finalizar Módulo")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                        onClick={navigateToNext} 
                        disabled={!quizCompleted}
                        className={`w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 ${phase.type !== 'quiz' ? 'hidden' : ''}`}
                    >
                        {nextPhase ? "Ir para Próxima Fase" : "Finalizar Módulo"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </main>
        </div>
    );
}