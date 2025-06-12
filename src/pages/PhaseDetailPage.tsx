// ARQUIVO: PhaseDetailPage.tsx
// CÓDIGO COMPLETO E ATUALIZADO

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Ícones e Componentes
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
    Phase, 
    Module, 
    Question 
} from "@/services/moduleService";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
// O caminho da importação mudou!
import { useRewardModal } from "@/components/XpRewardModal/RewardModalContext";

// Componentes auxiliares (sem alteração)
const PhaseDetailSkeleton = () => (
    <div className="min-h-screen bg-slate-50 animate-pulse">
        <header className="p-4 sm:p-6"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full bg-slate-200" /><Skeleton className="h-7 w-48 bg-slate-200" /></div></header>
        <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6"><Skeleton className="h-28 w-full rounded-2xl bg-slate-200" /><Skeleton className="aspect-video w-full rounded-2xl bg-slate-200" /></main>
    </div>
);

const formatTime = (totalSeconds: number | null): string => {
    if (totalSeconds === null) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const calculateXpForTime = (elapsedSeconds: number, questionCount: number): number => {
    if (questionCount === 0) return 5;
    const secondsPerQuestion = elapsedSeconds / questionCount;
    if (secondsPerQuestion <= 10) return 25;
    if (secondsPerQuestion <= 20) return 15;
    return 10;
};

export default function PhaseDetailPage() {
    const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showRewardModal } = useRewardModal();
    const [userId, setUserId] = useState<string | null>(null);
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
            if (user) setUserId(user.id);
        };
        getUserId();
        return () => { stopAudio(); };
    }, [stopAudio]);

    const { data, isLoading, error } = useQuery({
        queryKey: ['phaseDetailAllData', phaseId],
        queryFn: async () => {
            if (!phaseId || !moduleId) throw new Error("ID da fase ou módulo não encontrado.");
            const pId = Number(phaseId); const mId = Number(moduleId);
            const [phase, module, allPhases, questions] = await Promise.all([
                getPhaseById(pId), getModuleById(mId), getPhasesByModuleId(mId), getQuestionsByPhaseId(pId)
            ]);
            return { phase, module, allPhases, questions };
        },
        enabled: !!phaseId && !!moduleId,
    });
    
    const { phase, module, allPhases = [], questions = [] } = data || {};

    useEffect(() => {
        if (phase?.type === 'quiz' && questions.length > 0 && !quizStartTime) {
            setQuizStartTime(Date.now());
        }
    }, [phase, questions, quizStartTime]);

    useEffect(() => {
        if(error) {
            toast.error("Erro ao carregar dados da fase.");
            navigate(`/modulo/${moduleId}`);
        }
    }, [error, navigate, moduleId]);

    const currentPhaseIndex = allPhases.findIndex(p => p.id === Number(phaseId));
    const nextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;

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

    const navigateToNext = () => {
        setTimeout(() => {
            if (nextPhase) {
                navigate(`/fase/${moduleId}/${nextPhase.id}`);
            } else {
                toast.success("Módulo finalizado!", { description: "Parabéns por mais essa conquista!", icon: <CheckCircle className="text-green-500"/> });
                navigate(`/modulo/${moduleId}`);
            }
        }, 2500);
    }

    const handleCompletePhase = async () => {
        if (!userId || !phaseId || !moduleId || !phase) return;
        try {
            const { xpFromPhase, xpFromModule } = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), false);
            const totalXp = xpFromPhase + xpFromModule;
            if (totalXp > 0) {
                const title = xpFromModule > 0 ? "Módulo Concluído!" : "Fase Concluída!";
                showRewardModal({ xpAmount: totalXp, title });
            }
            queryClient.invalidateQueries({ queryKey: ['moduleDetailData', Number(moduleId)] });
            navigateToNext();
        } catch (error) { 
            console.error("Erro ao completar a fase:", error);
            toast.error("Erro ao registrar seu progresso."); 
        }
    };

    const handleCorrectAnswer = async () => {
        if (!userId || !phaseId || !moduleId || !phase) return;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        if (isLastQuestion) {
            const endTime = Date.now();
            const elapsedSeconds = quizStartTime ? Math.round((endTime - quizStartTime) / 1000) : 0;
            setQuizElapsedTime(elapsedSeconds);
            const xpGainedFromTime = calculateXpForTime(elapsedSeconds, questions.length);
            const wasQuizXpAwarded = await awardQuizXp(userId, Number(phaseId), xpGainedFromTime);
            if (wasQuizXpAwarded) {
                showRewardModal({ xpAmount: xpGainedFromTime, title: `Quiz Finalizado!` });
            }
            setQuizCompleted(true);
            const { xpFromModule } = await completePhaseAndAwardXp(userId, Number(phaseId), Number(moduleId), true);
            if (xpFromModule > 0) {
                setTimeout(() => showRewardModal({ xpAmount: xpFromModule, title: "Módulo Concluído!" }), wasQuizXpAwarded ? 1500 : 100);
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
                {phase.type === "quiz" && (<div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">{isLoading && <p>Carregando perguntas...</p>}{questions.length > 0 && !quizCompleted && currentQuestion && (<div><div className="flex justify-between text-sm text-gray-600 mb-2"><span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span></div><div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div></div><QuizQuestion key={currentQuestion.id} questionId={currentQuestion.id} question={currentQuestion.question} options={Array.isArray(currentQuestion.options) ? currentQuestion.options : []} correctAnswer={currentQuestion.correct_answer} tip={currentQuestion.tips_question || null} onCorrectAnswer={handleCorrectAnswer} /></div>)}{quizCompleted && (<div className="p-6 text-center bg-slate-50 rounded-lg"><h4 className="text-2xl font-bold text-slate-800 mb-3">Quiz Finalizado!</h4><div className="flex items-center justify-center gap-2 text-lg text-slate-700"><Clock className="h-6 w-6 text-orange-500" /><span>Tempo final:</span><span className="font-bold text-orange-500 text-xl">{formatTime(quizElapsedTime)}</span></div><p className="text-sm text-slate-500 mt-2">Você já pode avançar para a próxima fase.</p></div>)}</div>)}
                <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-200 pt-6">
                    {phase.type !== 'quiz' && (<Button onClick={handleCompletePhase} className="w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600">{nextPhase ? "Concluir e Próxima" : "Finalizar Módulo"} <ArrowRight className="ml-2 h-4 w-4" /></Button>)}
                    {phase.type === 'quiz' && quizCompleted && (<Button onClick={navigateToNext} className="w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600">{nextPhase ? "Ir para Próxima Fase" : "Finalizar Módulo"} <ArrowRight className="ml-2 h-4 w-4" /></Button>)}
                </div>
            </main>
        </div>
    );
}