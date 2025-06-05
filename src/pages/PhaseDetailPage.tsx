import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Trash2, Volume2, VolumeX } from "lucide-react";
import YoutubeEmbed from "@/components/YoutubeEmbed";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import QuizQuestion from "@/components/QuizQuestion";
import { 
  getPhaseById, 
  getPhasesByModuleId, 
  getQuestionsByPhaseId,
  Phase, 
  Question, 
  updateUserPhaseStatus,
  deletePhase as deletePhaseFunc
} from "@/services/moduleService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [videoNotes, setVideoNotes] = useState("");

  // Alterado para as novas opções de velocidade
  const [speechRate, setSpeechRate] = useState(1.0);
  const speedOptions = [1.0, 1.15, 1.25, 1.5];

  const {
    isPlaying,
    isLoading: isLoadingAudio,
    playText,
    getVoicesByLang,
  } = useTextToSpeech();

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

  const { data: questions = [], isLoading: isLoadingQuestions, refetch: refetchQuestions } = useQuery<Question[], Error>({
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

  useEffect(() => {
    if (phase?.video_notes) setVideoNotes(phase.video_notes);
  }, [phase]);

  const handleSpeedChange = () => {
    const currentIndex = speedOptions.indexOf(speechRate);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeechRate(speedOptions[nextIndex]);
  };

  const handleReadContent = () => {
    if (!phase?.content) {
      toast.error("Não há conteúdo para ler.");
      return;
    }
    
    playText(phase.content, {
      lang: 'pt-BR',
      rate: speechRate,
      pitch: 1.0, 
      voice: preferredPtVoice,
    });
  };

  const handleCompletePhase = async () => {
    if (!user || !phaseId) {
      toast.error(user ? "Erro ao identificar a fase." : "Você precisa estar logado.");
      return;
    }
    try {
      await updateUserPhaseStatus(user.id, Number(phaseId), "completed");
      toast.success("Fase completada!");
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
    mutationFn: async (id: number) => { 
      await deletePhaseFunc(id);
    },
    onSuccess: () => {
      toast.success("Fase excluída!");
      if (moduleId) navigate(`/modulo/${moduleId}`); else navigate('/');
      queryClient.invalidateQueries({ queryKey: ['phases', Number(moduleId)] });
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`),
  });

  const updatePhaseVideoNotesMutation = useMutation<void, Error, { phaseId: number; notes: string }>({
    mutationFn: async ({ phaseId, notes }) => {
      const { error } = await supabase.from('phases').update({ video_notes: notes }).eq('id', phaseId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Observações salvas!");
      queryClient.invalidateQueries({ queryKey: ['phase', Number(phaseId)] });
      setIsEditing(false);
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });

  const handleDelete = () => {
    if (phaseId && window.confirm("Tem certeza que deseja excluir esta fase?")) {
      deletePhaseMutation.mutate(Number(phaseId));
    }
  };

  const handleSaveVideoNotes = () => {
    if (phaseId) {
      updatePhaseVideoNotesMutation.mutate({ phaseId: Number(phaseId), notes: videoNotes });
    }
  };
  
  const currentPhaseIndex = phases.findIndex(p => p.id === Number(phaseId));
  const prevPhase = currentPhaseIndex > 0 ? phases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < phases.length - 1 && phases.length > 1 ? phases[currentPhaseIndex + 1] : null;

  if (isLoadingPhase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  if (phaseError || !phase) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <p className="text-gray-600 text-lg mb-4">
          {phaseError ? "Ocorreu um erro ao carregar os dados desta fase." : "Fase não encontrada ou indisponível."}
        </p>
        <Button onClick={() => navigate(moduleId ? `/modulo/${moduleId}` : '/')}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header 
        title={phase.name} 
        showBackButton={true}
        backButtonTarget={moduleId ? `/modulo/${moduleId}` : '/modulos'}
        rightContent={ user && ( <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={handleDelete} aria-label="Excluir fase"><Trash2 className="h-5 w-5" /></Button> )}
      />

      <div className="container px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8 p-6 bg-white shadow-lg rounded-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{phase.name}</h2>
          {phase.description && <p className="text-gray-700 mt-1 text-base">{phase.description}</p>}
        </div>

        {phase.type === "video" && phase.video_url && (
          <div className="mb-6 shadow-lg rounded-lg overflow-hidden">
            <YoutubeEmbed videoId={phase.video_url} />
          </div>
        )}
        {phase.type === "video" && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-semibold text-gray-700">Para pensar um pouco:</h3>
            </div>
            {isEditing ? (
              <>
                <RichTextEditor value={videoNotes} onChange={setVideoNotes} />
              </>
            ) : (
              <div 
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
                dangerouslySetInnerHTML={{ __html: videoNotes || "<p class='text-gray-500'>Nenhuma observação ainda.</p>" }}
              />
            )}
          </div>
        )}

        {(phase.type === "text" || phase.type === "challenge") && phase.content && (
          <div className="mt-6 mb-8 p-6 bg-white items-center shadow-lg rounded-lg">
            <p className="text-xs italic text-center text-gray-600 mb-1">aguarde alguns segundos para ouvir, a IA está analisando o texto (se não começar, tente novamente!)</p>
            <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
              <Button
                onClick={handleReadContent}
                variant="outline"
                className="flex items-center gap-2 py-2.5 text-base"
              >
                {/* Alterado para não mostrar o estado "Processando" */}
                {(isLoadingAudio || isPlaying) ? (
                  <><VolumeX className="h-5 w-5 mr-2" /> Parar a leitura</>
                ) : (
                  <><Volume2 className="h-5 w-5 mr-2" /> Ouvir o conteúdo</>
                )}
              </Button>
              <Button
                onClick={handleSpeedChange}
                variant="outline"
                disabled={isPlaying || isLoadingAudio}
                aria-label={`Mudar velocidade da leitura, atual: ${speechRate}x`}
              >
                Velocidade: {speechRate.toFixed(2)}x
              </Button>
            </div>
            
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" dangerouslySetInnerHTML={{ __html: phase.content }} />
          </div>
        )}

        {phase.type === "text" && phase.images && phase.images.length > 0 && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Imagens Adicionais</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {phase.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Imagem da fase ${index + 1}`}
                  className="rounded-lg shadow-md object-cover aspect-square hover:opacity-90 transition-opacity"
                />
              ))}
            </div>
          </div>
        )}

        {phase.type === "quiz" && (
          <div className="mt-6 mb-8 p-6 bg-white shadow-lg rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">Questionário</h3>
                {!quizCompleted && questions.length > 0 && (
                    <Button size="sm" variant="outline" onClick={() => refetchQuestions()} disabled={isLoadingQuestions}>
                        {isLoadingQuestions ? "Recarregando..." : "Recarregar"}
                    </Button>
                )}
            </div>
            {isLoadingQuestions ? ( <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-4 border-trilha-orange border-t-transparent"></div></div>
            ) : questions.length === 0 ? ( <p className="text-gray-600">Nenhuma pergunta disponível.</p>
            ) : quizCompleted ? (
              <div className="p-6 text-center">
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Resultado</h4>
                <p className="text-lg text-gray-700">Você acertou {correctAnswers} de {questions.length}!</p>
                <p className="text-lg mt-4 font-medium">
                  {correctAnswers / questions.length >= 0.7 ? "Excelente!" : "Continue praticando!"}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Pergunta {currentQuestionIndex + 1} de {questions.length}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                  <div className="bg-trilha-orange h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                {questions[currentQuestionIndex] && (
                  <QuizQuestion
                    key={questions[currentQuestionIndex].id + '-' + currentQuestionIndex}
                    questionId={questions[currentQuestionIndex].id}
                    question={questions[currentQuestionIndex].question}
                    options={Array.isArray(questions[currentQuestionIndex].options) ? questions[currentQuestionIndex].options : []}
                    correctAnswer={questions[currentQuestionIndex].correct_answer}
                    onAnswer={handleQuizAnswer}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
            {prevPhase ? ( <Button variant="outline" onClick={() => navigate(`/fase/${moduleId}/${prevPhase.id}`)} className="w-full sm:w-auto"><ArrowLeft className="mr-2 h-4 w-4" /> Anterior</Button>
            ) : <div className="hidden sm:block sm:w-1/3"></div>}
            
            {(phase.type !== 'quiz' || quizCompleted || questions.length === 0) && (
              <Button onClick={handleCompletePhase} className="bg-trilha-orange hover:bg-trilha-orange-dark w-full sm:w-auto order-first sm:order-none py-2.5 text-base">
                {nextPhase ? "Concluir e Próxima Lição" : "Concluir Módulo"}
              </Button>
            )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;