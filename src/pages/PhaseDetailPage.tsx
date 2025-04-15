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
      console.error("User not authenticated");
      toast.error("You must be logged in to complete this phase.");
      return;
    }
    
    if (!phaseId) {
      console.error("Phase ID not available");
      toast.error("Error identifying phase. Please try again.");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Updating phase status:", { userId: user.id, phaseId: Number(phaseId) });
      
      const result = await updateUserPhaseStatus(user.id, Number(phaseId), "completed");
      
      if (!result) {
        throw new Error("Failed to update phase status");
      }
      
      toast.success("Phase completed successfully!");
      queryClient.invalidateQueries({ queryKey: ['phases'] });
      
      if (nextPhase) {
        navigate(`/fase/${moduleId}/${nextPhase.id}`);
      } else {
        navigate(`/modulo/${moduleId}`);
      }
    } catch (error: any) {
      console.error("Error completing phase:", error);
      toast.error(error.message || "Error completing phase. Please try again.");
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

  const { data: phase, isLoading: isLoadingPhase } = useQuery({
    queryKey: ['phase', Number(phaseId)],
    queryFn: () => getPhaseById(Number(phaseId)),
    enabled: !!phaseId,
  });

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
      toast.success("Phase deleted successfully!");
      navigate(`/modulo/${moduleId}`);
    },
    onError: (error) => {
      toast.error("Error deleting phase");
      console.error("Error deleting phase:", error);
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
      toast.success("Observations updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['phase'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Error updating observations");
      console.error("Error updating video notes:", error);
    }
  });

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this phase?")) {
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
        <p className="text-gray-500">Phase not found.</p>
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
              <h3 className="text-lg font-medium">Observations about the video</h3>
              {isEditing ? (
                <div className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveVideoNotes}>
                    Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit
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
            <h3 className="text-lg font-medium mb-3">Images</h3>
            <div className="flex flex-wrap gap-4">
              {phase.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="rounded-lg shadow-md"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                />
              ))}
            </div>
          </div>
        )}

        {phase.type === "quiz" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Quiz</h3>
            <div className="mb-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetchQuestions()}
                className="mb-3"
              >
                Reload Questions
              </Button>
            </div>
            
            {isLoadingQuestions ? (
              <div className="flex items-center justify-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-trilha-orange border-t-transparent"></div>
              </div>
            ) : questions.length === 0 ? (
              <p>No questions available for this quiz.</p>
            ) : quizCompleted ? (
              <div className="p-6 bg-white rounded-lg shadow-sm border text-center">
                <h4 className="text-xl font-bold mb-4">Quiz Result</h4>
                <p className="text-lg">
                  You answered {correctAnswers} out of {questions.length} questions correctly!
                </p>
                <p className="text-lg mt-4">
                  {correctAnswers === questions.length ? 
                    "Congratulations! You answered all questions correctly!" : 
                    "Keep practicing to improve your knowledge!"}
                </p>
              </div>
            ) : (
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete
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
                    <p>Loading question... {isLoadingQuestions ? "(Wait)" : "(Click Reload Questions)"}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase.type === "challenge" && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Challenge</h3>
            {phase.content ? (
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: phase.content || "" }} 
                />
              </div>
            ) : (
              <div className="p-6 bg-white rounded-lg shadow-sm border text-center">
                <p className="text-lg text-gray-500">Challenge content not available.</p>
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
                  <span className="text-sm">Previous</span>
                </Link>
              )}
            </div>
            
            {(phase.type !== 'quiz' || quizCompleted) && (
              <Button onClick={handleCompletePhase} className="bg-trilha-orange hover:bg-trilha-orange/90">
                Complete
              </Button>
            )}
            
            <div>
              {nextPhase && (
                <Link 
                  to={`/fase/${moduleId}/${nextPhase.id}`} 
                  className="flex items-center text-gray-600 hover:text-trilha-orange"
                >
                  <span className="text-sm">Next</span>
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
