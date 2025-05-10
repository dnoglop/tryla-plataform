import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [videoNotes, setVideoNotes] = useState("");
  
  const handleQuizAnswer = async (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
      if (user) {
        await handleCompletePhase();
      }
    }
  };
  
  const handleCompletePhase = async () => {
    if (!user) {
      console.error("Usuário não autenticado");
      toast.error("Você precisa estar logado para completar esta fase.");
      return;
    }
    
    if (!phaseId) {
      console.error("ID da fase não disponível");
      toast.error("Erro ao identificar a fase. Por favor, tente novamente.");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Updating phase status:", { userId: user.id, phaseId: Number(phaseId) });
      
      const result = await updateUserPhaseStatus(user.id, Number(phaseId), "completed");
      
      if (!result) {
        throw new Error("Falha ao atualizar o status da fase");
      }
      
      toast.success("Fase completada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      
      if (nextPhase) {
        navigate(`/fase/${moduleId}/${nextPhase.id}`);
      } else {
        navigate(`/modulo/${moduleId}`);
      }
    } catch (error: any) {
      console.error("Erro ao completar fase:", error);
      toast.error(error.message || "Erro ao completar fase. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const queryClient = useQueryClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    getUser();
  }, []);

  const { data: phase, isLoading: isLoadingPhase, error: phaseError } = useQuery({
    queryKey: ['phase', Number(phaseId)],
    queryFn: async () => {
      console.log("Iniciando busca da fase:", phaseId);
      try {
        const result = await getPhaseById(Number(phaseId));
        console.log("Resultado da busca da fase:", result);
        return result;
      } catch (error) {
        console.error("Erro ao buscar fase:", error);
        throw error;
      }
    },
    enabled: !!phaseId,
    retry: 3,
    retryDelay: 1000,
  });

  // Adicione este useEffect para monitorar erros
  useEffect(() => {
    if (phaseError) {
      console.error("Erro ao carregar fase:", phaseError);
      toast.error("Erro ao carregar dados da fase. Verifique sua conexão com o banco de dados.");
    }
  }, [phaseError]);

  const { data: phases = [], isLoading: isLoadingPhases } = useQuery({
    queryKey: ['phases', Number(moduleId)],
    queryFn: () => getPhasesByModuleId(Number(moduleId)),
    enabled: !!moduleId,
  });

  const { data: questions = [], isLoading: isLoadingQuestions, refetch: refetchQuestions } = useQuery({
    queryKey: ['questions', Number(phaseId)],
    queryFn: () => getQuestionsByPhaseId(Number(phaseId)),
    enabled: !!phaseId && phase?.type === 'quiz',
    staleTime: 0,
    refetchOnMount: true,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (phase?.type === 'quiz') {
      console.log('Questões carregadas:', questions);
      console.log('Índice atual da questão:', currentQuestionIndex);
      console.log('Questão atual:', questions[currentQuestionIndex]);
      
      if (questions.length === 0) {
        console.warn('Nenhuma questão encontrada para este quiz');
      }
      
      if (questions[currentQuestionIndex] && (!questions[currentQuestionIndex].options || !Array.isArray(questions[currentQuestionIndex].options))) {
        console.error('Opções inválidas para a questão atual:', questions[currentQuestionIndex]);
      }
    }
  }, [questions, currentQuestionIndex, phase]);

  useEffect(() => {
    if (!isLoadingPhase && !isLoadingPhases && (!isLoadingQuestions || phase?.type !== 'quiz')) {
      setLoading(false);
    }
  }, [isLoadingPhase, isLoadingPhases, isLoadingQuestions, phase]);

  const currentPhaseIndex = phases.findIndex(p => p.id === Number(phaseId));
  const prevPhase = currentPhaseIndex > 0 ? phases[currentPhaseIndex - 1] : null;
  const nextPhase = currentPhaseIndex < phases.length - 1 ? phases[currentPhaseIndex + 1] : null;

  useEffect(() => {
    if (phase?.video_notes) {
      setVideoNotes(phase.video_notes);
    }
  }, [phase]);

  const deletePhaseMutation = useMutation({
    mutationFn: (phaseId: number) => deletePhaseFunc(phaseId),
    onSuccess: () => {
      toast.success("Fase excluída com sucesso!");
      navigate(`/modulo/${moduleId}`);
    },
    onError: (error) => {
      toast.error("Erro ao excluir fase");
      console.error("Erro ao excluir fase:", error);
    }
  });

  const updatePhaseVideoNotesMutation = useMutation({
    mutationFn: async ({ phaseId, notes }: { phaseId: number; notes: string }) => {
      const { error } = await supabase
        .from('phases')
        .update({ video_notes: notes })
        .eq('id', phaseId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Observações atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['phase'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar observações");
      console.error("Erro ao atualizar anotações do vídeo:", error);
    }
  });

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir esta fase?")) {
      deletePhaseMutation.mutate(Number(phaseId));
    }
  };

  const handleSaveVideoNotes = () => {
    if (!phaseId) return;
    updatePhaseVideoNotesMutation.mutate({
      phaseId: Number(phaseId),
      notes: videoNotes
    });
  };

  // Remova este useEffect duplicado
  useEffect(() => {
    const fetchPhaseData = async () => {
      try {
        console.log("Carregando fase:", phaseId);
        setIsLoading(true);
        
        if (!phaseId) {
          console.error("ID da fase não encontrado");
          toast.error("Erro ao carregar a fase. ID não encontrado.");
          return;
        }
        
        const phaseData = await getPhaseById(Number(phaseId));
        console.log("Dados da fase carregados:", phaseData);
        
        if (!phaseData) {
          console.error("Fase não encontrada");
          toast.error("Fase não encontrada.");
          return;
        }
        
        setPhase(phaseData);
      } catch (error) {
        console.error("Erro ao carregar fase:", error);
        toast.error("Erro ao carregar a fase. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPhaseData();
  }, [phaseId]);

  // Adicione este useEffect para testar a conexão com o Supabase
  useEffect(() => {
    const testDatabaseConnection = async () => {
      try {
        console.log("Testando conexão com o Supabase...");
        const { data, error } = await supabase.from('phases').select('count').limit(1);
        
        if (error) {
          console.error("Erro na conexão com o Supabase:", error);
          toast.error("Erro na conexão com o banco de dados. Verifique sua conexão com a internet.");
        } else {
          console.log("Conexão com o Supabase bem-sucedida:", data);
        }
      } catch (e) {
        console.error("Exceção ao testar conexão:", e);
      }
    };
    
    testDatabaseConnection();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-trilha-orange border-t-transparent"></div>
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Fase não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header 
        title={phase.name} 
        showBackButton={true}
        rightContent={
          user && (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )
        }
      />

      <div className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{phase.name}</h2>
          {phase.description && (
            <p className="text-gray-600 mt-2">{phase.description}</p>
          )}
        </div>

        {phase.type === "video" && phase.video_url && (
          <YoutubeEmbed videoId={phase.video_url} />
        )}

        {phase.type === "video" && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Observações sobre o vídeo</h3>
              {isEditing ? (
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveVideoNotes}>
                    Salvar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              {isEditing ? (
                <RichTextEditor value={videoNotes} onChange={setVideoNotes} />
              ) : (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: phase.video_notes || "" }}
                />
              )}
            </div>
          </div>
        )}

        {phase.type === "text" && (
          <div
            className="mt-6 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: phase.content || "" }}
          />
        )}

        {phase.type === "text" && phase.images && phase.images.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Imagens</h3>
            <div className="flex flex-wrap gap-4">
              {phase.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Imagem ${index + 1}`}
                  className="rounded-lg shadow-md"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                />
              ))}
            </div>
          </div>
        )}

        {phase.type === "quiz" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Questionário</h3>
            <div className="mb-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetchQuestions()}
                className="mb-3"
              >
                Recarregar Perguntas
              </Button>
            </div>
            
            {isLoadingQuestions ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-trilha-orange border-t-transparent"></div>
              </div>
            ) : questions.length === 0 ? (
              <p>Nenhuma pergunta disponível para este questionário.</p>
            ) : quizCompleted ? (
              <div className="p-6 bg-white rounded-lg shadow-sm border text-center">
                <h4 className="text-xl font-bold mb-4">Resultado do Questionário</h4>
                <p className="text-lg">
                  Você acertou {correctAnswers} de {questions.length} perguntas!
                </p>
                <p className="text-lg mt-4">
                  {correctAnswers === questions.length ? 
                    "Parabéns! Você acertou todas as perguntas!" : 
                    "Continue praticando para melhorar seu conhecimento!"}
                </p>
              </div>
            ) : (
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium">
                    Pergunta {currentQuestionIndex + 1} de {questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% completo
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div 
                    className="bg-trilha-orange h-2 rounded-full" 
                    style={{ width: `${Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%` }}
                  ></div>
                </div>
                {questions && questions.length > 0 && currentQuestionIndex < questions.length ? (
                  <QuizQuestion
                    key={`question-${questions[currentQuestionIndex].id}-${currentQuestionIndex}`}
                    questionId={questions[currentQuestionIndex].id}
                    question={questions[currentQuestionIndex].question}
                    options={Array.isArray(questions[currentQuestionIndex].options) ? questions[currentQuestionIndex].options : []}
                    correctAnswer={questions[currentQuestionIndex].correct_answer}
                    onAnswer={handleQuizAnswer}
                  />
                ) : (
                  <div className="text-center p-4">
                    <p>Carregando pergunta... {isLoadingQuestions ? "(Aguarde)" : "(Clique em Recarregar Perguntas)"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase.type === "challenge" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Desafio</h3>
            {phase.content ? (
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: phase.content || "" }} 
                />
              </div>
            ) : (
              <div className="p-6 bg-white rounded-lg shadow-sm border text-center">
                <p className="text-lg text-gray-500">Conteúdo do desafio não disponível.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              {prevPhase && (
                <Link 
                  to={`/fase/${moduleId}/${prevPhase.id}`} 
                  className="flex items-center text-gray-600 hover:text-trilha-orange"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-sm">Anterior</span>
                </Link>
              )}
            </div>
            
            {(phase.type !== 'quiz' || quizCompleted) && (
              <Button onClick={handleCompletePhase} className="bg-trilha-orange hover:bg-trilha-orange/90">
                Completar
              </Button>
            )}
            
            <div>
              {nextPhase && (
                <Link 
                  to={`/fase/${moduleId}/${nextPhase.id}`} 
                  className="flex items-center text-gray-600 hover:text-trilha-orange"
                >
                  <span className="text-sm">Próximo</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;
