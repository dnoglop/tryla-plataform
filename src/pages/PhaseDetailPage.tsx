import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Trash2, Volume2, VolumeX } from "lucide-react";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import QuizQuestion from "@/components/QuizQuestion";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  getPhaseById, getPhasesByModuleId, getQuestionsByPhaseId,
  Phase, Question, updateUserPhaseStatus, deletePhase as deletePhaseFunc
} from "@/services/moduleService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

const primaryButtonClass = "bg-trilha-orange text-white font-semibold rounded-full px-8 py-3 text-base shadow-md hover:shadow-lg hover:bg-trilha-orange-dark transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed";
const secondaryButtonClass = "bg-white text-gray-700 font-semibold border border-gray-200 rounded-full px-6 py-2 shadow-md hover:shadow-lg hover:bg-gray-50 transform hover:-translate-y-px transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2";

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [videoNotes, setVideoNotes] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.15);
  const speedOptions = [1.15, 1.25, 1.5];
  const { isPlaying, isLoading: isLoadingAudio, playText } = useTextToSpeech();
  const [preferredPtVoice, setPreferredPtVoice] = useState<SpeechSynthesisVoice | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();
  }, []);

  const { data: phase, isLoading: isLoadingPhase, error: phaseError } = useQuery<Phase | null, Error>({
    queryKey: ['phase', Number(phaseId)],
    queryFn: () => getPhaseById(Number(phaseId)),
    enabled: !!phaseId,
  });
  
  const { data: phases = [] } = useQuery<Phase[], Error>({
    queryKey: ['phases', Number(moduleId)],
    queryFn: () => getPhasesByModuleId(Number(moduleId)),
    enabled: !!moduleId,
  });

  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<Question[], Error>({
    queryKey: ['questions', Number(phaseId)],
    queryFn: () => getQuestionsByPhaseId(Number(phaseId)),
    enabled: !!phaseId && phase?.type === 'quiz',
  });
  
  useEffect(() => {
    if (phaseError) {
      console.error("Erro ao carregar fase:", phaseError);
      toast.error("Erro ao carregar dados da fase.");
    }
  }, [phaseError]);

  useEffect(() => { if (phase?.video_notes) setVideoNotes(phase.video_notes); }, [phase]);
  
  const handleSpeedChange = () => setSpeechRate(speedOptions[(speedOptions.indexOf(speechRate) + 1) % speedOptions.length]);

  const handleReadContent = () => {
    if (!phase?.content) {
      toast.error("Não há conteúdo para ler.");
      return;
    }
    playText(phase.content, { lang: 'pt-BR', rate: speechRate, voice: preferredPtVoice });
  };

  const handleCompletePhase = async () => {
    if (!user || !phaseId) {
      toast.error(user ? "Erro ao identificar a fase." : "Você precisa estar logado.");
      return;
    }
    try {
      await updateUserPhaseStatus(user.id, Number(phaseId), "completed");
      toast.success("Fase completada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['phases', Number(moduleId)] });
      const currentIdx = phases.findIndex(p => p.id === Number(phaseId));
      const nextPh = currentIdx !== -1 && currentIdx < phases.length - 1 ? phases[currentIdx + 1] : null;
      if (nextPh) navigate(`/fase/${moduleId}/${nextPh.id}`);
      else navigate(`/modulo/${moduleId}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao completar fase.");
    }
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    if (isCorrect) setCorrectAnswers(prev => prev + 1);
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };
  
  const deletePhaseMutation = useMutation<void, Error, number>({
    // AQUI ESTÁ A CORREÇÃO
    // Envolvemos a chamada a `deletePhaseFunc` em uma nova função async.
    // Esta nova função chama a original, mas não retorna seu valor booleano,
    // cumprindo assim o contrato de `Promise<void>`.
    mutationFn: async (id: number) => {
      const success = await deletePhaseFunc(id);
      if (!success) {
        // Se a função de serviço retornar `false`, lançamos um erro
        // para que o `onError` do useMutation seja acionado.
        throw new Error("A exclusão da fase falhou.");
      }
    },
    onSuccess: () => {
      toast.success("Fase excluída com sucesso!");
      if (moduleId) navigate(`/modulo/${moduleId}`); else navigate('/');
      queryClient.invalidateQueries({ queryKey: ['phases', Number(moduleId)] });
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const updatePhaseVideoNotesMutation = useMutation<void, Error, { phaseId: number; notes: string }>({
    // AQUI ESTÁ A CORREÇÃO: Usando async/await
    mutationFn: async ({ phaseId, notes }) => {
      const { error } = await supabase
        .from('phases')
        .update({ video_notes: notes })
        .eq('id', phaseId);
      
      if (error) {
        throw error; // Lançar o erro faz o onError do useMutation ser ativado
      }
    },
    onSuccess: () => {
      toast.success("Observações salvas!");
      queryClient.invalidateQueries({ queryKey: ['phase', Number(phaseId)] });
      setIsEditing(false);
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });
  
  const handleDeleteConfirm = () => {
    if (phaseId) deletePhaseMutation.mutate(Number(phaseId));
    setIsDeleteDialogOpen(false);
  };
  
  const handleSaveVideoNotes = () => { if (phaseId) updatePhaseVideoNotesMutation.mutate({ phaseId: Number(phaseId), notes: videoNotes }); };
  
  const currentPhaseIndex = phases.findIndex(p => p.id === Number(phaseId));
  const prevPhase = currentPhaseIndex > 0 ? phases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < phases.length - 1 ? phases[currentPhaseIndex + 1] : null;

  if (isLoadingPhase) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div></div>;

  if (phaseError || !phase) return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <p className="text-gray-600 text-lg mb-4">{phaseError ? "Ocorreu um erro ao carregar os dados." : "Fase não encontrada."}</p>
      <Button onClick={() => navigate(moduleId ? `/modulo/${moduleId}` : '/')} className={secondaryButtonClass}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title={phase.name} showBackButton={true} backButtonTarget={moduleId ? `/modulo/${moduleId}` : '/modulos'} />
      <div className="container px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{phase.name}</h2>
          {phase.description && <p className="text-gray-700 mt-1 text-base">{phase.description}</p>}
        </div>

        {phase.type === "video" && phase.video_url && <div className="mb-6 shadow-lg rounded-lg overflow-hidden"><YoutubeEmbed videoId={phase.video_url} /></div>}
        
        {phase.type === "video" && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Para pensar um pouco:</h3>
            {isEditing ? (
              <>
                <RichTextEditor value={videoNotes} onChange={setVideoNotes} />
                <Button onClick={handleSaveVideoNotes} className={`${primaryButtonClass} mt-4`}>Salvar Observações</Button>
              </>
            ) : (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: videoNotes || "<p class='text-gray-500'>Nenhuma observação ainda.</p>" }} />
            )}
          </div>
        )}

        {(phase.type === "text" || phase.type === "challenge") && phase.content && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
              <Button onClick={handleReadContent} className="bg-trilha-orange text-white font-semibold rounded-full px-6 py-2 flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-trilha-orange-dark transition-all duration-300 ease-in-out disabled:opacity-60">
                {(isLoadingAudio || isPlaying) ? <><VolumeX className="h-5 w-5" /> Parar</> : <><Volume2 className="h-5 w-5" /> Ouvir</>}
              </Button>
              <Button onClick={handleSpeedChange} disabled={isPlaying || isLoadingAudio} className="border border-trilha-orange text-trilha-orange font-semibold bg-white rounded-full px-5 py-2 hover:bg-trilha-orange hover:text-white transition-all duration-300 ease-in-out disabled:opacity-60">{speechRate.toFixed(2)}x</Button>
            </div>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: phase.content }} />
          </div>
        )}

        {phase.type === "quiz" && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Questionário</h3>
            {isLoadingQuestions ? <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-4 border-trilha-orange border-t-transparent"></div></div>
            : questions.length === 0 ? <p className="text-gray-600">Nenhuma pergunta disponível.</p>
            : quizCompleted ? (
              <div className="p-6 text-center bg-gray-50 rounded-lg">
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Resultado do Quiz</h4>
                <p className="text-lg text-gray-700">Você acertou <span className="font-bold text-trilha-orange">{correctAnswers}</span> de <span className="font-bold">{questions.length}</span>!</p>
                <div className="mt-4 text-3xl animate-bounce">{correctAnswers / questions.length >= 0.7 ? "🎉" : "💪"}</div>
                <p className="text-lg mt-2 font-medium">{correctAnswers / questions.length >= 0.7 ? "Excelente trabalho!" : "Continue praticando!"}</p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2"><span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span><span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-trilha-orange h-2.5 rounded-full transition-all" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div></div>
                {questions[currentQuestionIndex] && <QuizQuestion key={questions[currentQuestionIndex].id} questionId={questions[currentQuestionIndex].id} question={questions[currentQuestionIndex].question} options={Array.isArray(questions[currentQuestionIndex].options) ? questions[currentQuestionIndex].options : []} correctAnswer={questions[currentQuestionIndex].correct_answer} onAnswer={handleQuizAnswer} />}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
            {prevPhase && <Button onClick={() => navigate(`/fase/${moduleId}/${prevPhase.id}`)} className={`${secondaryButtonClass} w-full sm:w-auto`}><ArrowLeft className="mr-2 h-4 w-4" /> Anterior</Button>}
            {(phase.type !== 'quiz' || quizCompleted || questions.length === 0) && (
              <Button onClick={handleCompletePhase} className={`${primaryButtonClass} w-full sm:w-auto order-first sm:order-none ${!prevPhase ? 'ml-auto' : ''}`}>{nextPhase ? "Concluir e Próxima" : "Concluir Módulo"}</Button>
            )}
        </div>

        {user?.id && (
            <div className="mt-8 flex justify-end">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a fase.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">Sim, excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        )}

      </div>
      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;