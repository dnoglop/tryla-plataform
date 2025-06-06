import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Ícones e Componentes
import { ArrowLeft, ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import QuizQuestion from "@/components/QuizQuestion";
import { Skeleton } from "@/components/ui/skeleton";
import { getPhaseById, getModuleById, getPhasesByModuleId, getQuestionsByPhaseId, updateUserPhaseStatus, Phase, Module, Question } from "@/services/moduleService";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

// --- COMPONENTES AUXILIARES ---
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

// --- COMPONENTE PRINCIPAL ---
export default function PhaseDetailPage() {
    const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);
    
    // Estados do Quiz
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);

    // Estados da Leitura de Voz
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

    // Busca de dados com react-query
    const { data, isLoading, error } = useQuery({
        queryKey: ['phaseDetailAllData', phaseId],
        queryFn: async () => {
            if (!phaseId || !moduleId) throw new Error("ID da fase ou módulo não encontrado.");
            const pId = Number(phaseId);
            const mId = Number(moduleId);

            const [phase, module, allPhases] = await Promise.all([
                getPhaseById(pId),
                getModuleById(mId),
                getPhasesByModuleId(mId)
            ]);
            
            let questions: Question[] = [];
            if (phase?.type === 'quiz') {
                questions = await getQuestionsByPhaseId(pId);
            }
            return { phase, module, allPhases, questions };
        },
        enabled: !!phaseId && !!moduleId,
        retry: 1,
    });

    useEffect(() => {
        if(error) {
            toast.error("Erro ao carregar dados da fase.");
            navigate(`/modulo/${moduleId}`);
        }
    }, [error, navigate, moduleId]);

    const { phase, module, allPhases = [], questions = [] } = data || {};

    const currentPhaseIndex = allPhases.findIndex(p => p.id === Number(phaseId));
    const prevPhase = currentPhaseIndex > 0 ? allPhases[currentPhaseIndex - 1] : null;
    const nextPhase = currentPhaseIndex !== -1 && currentPhaseIndex < allPhases.length - 1 ? allPhases[currentPhaseIndex + 1] : null;

    const handleReadContent = () => {
        if (!phase?.content) return;
        if (isPlaying) {
            stopAudio();
        } else {
            const plainText = phase.content.replace(/<[^>]*>?/gm, ' ');
            playText(plainText, { lang: 'pt-BR', rate: speechRate });
        }
    };
    
    const handleSpeedChange = () => {
        const currentIndex = speedOptions.indexOf(speechRate);
        const nextIndex = (currentIndex + 1) % speedOptions.length;
        const newSpeed = speedOptions[nextIndex];
        setSpeechRate(newSpeed);
        toast.info(`Velocidade alterada para ${newSpeed}x`);
    };

    const handleCompletePhase = async () => {
        if (!userId || !phaseId) return;
        try {
            await updateUserPhaseStatus(userId, Number(phaseId), "completed");
            toast.success("Fase concluída com sucesso!");
            
            queryClient.invalidateQueries({ queryKey: ['moduleDetailData', Number(moduleId)] });
            
            if (nextPhase) {
                navigate(`/fase/${moduleId}/${nextPhase.id}`);
            } else {
                toast.success("Módulo finalizado!", { description: "Parabéns por mais essa conquista!" });
                navigate(`/modulo/${moduleId}`);
            }
        } catch (error) { toast.error("Erro ao completar a fase."); }
    };

    const handleQuizAnswer = (isCorrect: boolean) => {
        if (isCorrect) setCorrectAnswers(prev => prev + 1);
        if (questions && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizCompleted(true);
        }
    };

    if (isLoading) return <PhaseDetailSkeleton />;
    if (!phase || !module) return <div className="p-4 text-center">Fase ou Módulo não encontrado.</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <header className="p-4 sm:p-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/modulo/${moduleId}`)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 truncate">{module.name}</h1>
                </div>
            </header>

            <main className="container px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800">{phase.name}</h2>
                    {phase.description && <p className="text-slate-600 mt-2 text-base">{phase.description}</p>}
                </div>

                {phase.type === "video" && phase.video_url && (
                    <div className="shadow-lg rounded-2xl overflow-hidden aspect-video">
                        <YoutubeEmbed videoId={phase.video_url} />
                    </div>
                )}
                
                {(phase.type === "text" || phase.type === "challenge") && phase.content && (
                    <div className="p-6 bg-white rounded-2xl shadow-sm">
                        <div className="flex justify-end items-center gap-4 mb-4">
                            <Button variant="outline" size="sm" onClick={handleReadContent} disabled={isLoadingAudio} className="text-white bg-orange-500 hover:bg-orange-600">
                                {isPlaying ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                                {isPlaying ? 'Parar' : 'Ouvir Texto'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleSpeedChange} disabled={isPlaying || isLoadingAudio}>
                                {speechRate.toFixed(2)}x
                            </Button>
                        </div>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: phase.content }} />
                    </div>
                )}

                {phase.type === "quiz" && (
                    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50">
                        {isLoading && <p>Carregando perguntas...</p>}
                        {questions.length > 0 && !quizCompleted && (
                            <div>
                                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span></div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div></div>
                                <QuizQuestion
                                    key={questions[currentQuestionIndex].id}
                                    questionId={questions[currentQuestionIndex].id}
                                    question={questions[currentQuestionIndex].question}
                                    options={Array.isArray(questions[currentQuestionIndex].options) ? questions[currentQuestionIndex].options : []}
                                    correctAnswer={questions[currentQuestionIndex].correct_answer}
                                    onAnswer={handleQuizAnswer}
                                />
                            </div>
                        )}
                        {quizCompleted && (
                            <div className="p-6 text-center bg-slate-50 rounded-lg">
                                <h4 className="text-2xl font-bold text-slate-800 mb-3">Resultado do Quiz</h4>
                                <p className="text-lg text-slate-700">Você acertou <span className="font-bold text-orange-500">{correctAnswers}</span> de <span className="font-bold">{questions.length}</span>!</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
                    {prevPhase ? (
                        <Button onClick={() => navigate(`/fase/${moduleId}/${prevPhase.id}`)} variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>
                    ) : <div />}
                    
                    {(phase.type !== 'quiz' || quizCompleted || (questions && questions.length === 0)) && (
                        <Button onClick={handleCompletePhase} className="w-full sm:w-auto text-white bg-orange-500 hover:bg-orange-600">
                            {nextPhase ? "Concluir e Próxima" : "Finalizar Módulo"} 
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </main>
        </div>
    );
}