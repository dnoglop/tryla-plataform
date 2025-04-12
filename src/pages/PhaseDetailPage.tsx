import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import QuizQuestion from "@/components/QuizQuestion";
import { getPhaseById, getQuestionsByPhaseId, Phase } from "@/services/moduleService";

const PhaseDetailPage = () => {
  const { moduleId, phaseId } = useParams<{ moduleId: string; phaseId: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  
  const [step, setStep] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phaseData, setPhaseData] = useState<Phase | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Buscar dados da fase do backend
  useEffect(() => {
    const fetchPhaseData = async () => {
      if (!moduleId || !phaseId) return;
      
      try {
        setLoading(true);
        const phaseResult = await getPhaseById(parseInt(phaseId));
        
        if (phaseResult) {
          setPhaseData(phaseResult);
          
          // Se a fase for do tipo quiz, buscar as perguntas
          if (phaseResult.type === 'quiz') {
            const questionsResult = await getQuestionsByPhaseId(parseInt(phaseId));
            setQuestions(questionsResult);
          }
        } else {
          uiToast({
            title: "Erro",
            description: "Fase não encontrada",
            variant: "destructive"
          });
          navigate(`/modulo/${moduleId}`);
        }
      } catch (error) {
        console.error("Erro ao buscar dados da fase:", error);
        uiToast({
          title: "Erro",
          description: "Não foi possível carregar os dados da fase",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPhaseData();
  }, [moduleId, phaseId, navigate, uiToast]);
  
  // Estrutura de dados para a fase baseada nos dados do backend
  const phase = phaseData ? {
    title: phaseData.name,
    steps: [
      // Se tiver vídeo
      ...(phaseData.video_url ? [{
        type: "video",
        title: "Separamos um vídeo para você assistir",
        text: "Muita atenção aos detalhes dele, segredos serão compartilhados.",
        videoId: extractYoutubeId(phaseData.video_url) || "",
        videoNotes: phaseData.video_notes || "",
      }] : []),
      
      // Se tiver conteúdo de texto
      ...(phaseData.content ? [{
        type: "content",
        title: phaseData.description,
        text: phaseData.content,
        images: phaseData.image_urls,
      }] : []),
      
      // Se for quiz e tiver perguntas
      ...(phaseData.type === 'quiz' && questions.length > 0 ? [{
        type: "quiz",
        title: "Teste seus conhecimentos",
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
        })),
      }] : []),
      
      // Se for desafio
      ...(phaseData.type === 'challenge' ? [{
        type: "challenge",
        title: "Desafio Prático",
        description: phaseData.content || "Complete este desafio para avançar.",
        reflection: "O que você aprendeu com este desafio?"
      }] : []),
      
      // Sempre adicionar a etapa de conclusão
      {
        type: "completion",
        title: "Fase completa!",
        xpGained: 100,
      }
    ]
  } : {
    // Dados padrão enquanto carrega
    title: "Carregando...",
    steps: []
  };
  
  // Função para extrair o ID do vídeo do YouTube de uma URL
  function extractYoutubeId(url: string | undefined): string | null {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  // Função para renderizar conteúdo com imagens
  function renderContentWithImages(text: string, images?: string[]) {
    if (!text) return null;
    
    // Se não houver imagens, apenas retornar o texto
    if (!images || images.length === 0) {
      return <p>{text}</p>;
    }
    
    // Dividir o texto em parágrafos
    const paragraphs = text.split('\n\n');
    
    // Renderizar parágrafos com imagens intercaladas
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => (
          <div key={index}>
            <p>{paragraph}</p>
            {/* Inserir imagem após alguns parágrafos, se disponível */}
            {images[index] && index < images.length && (
              <div className="my-4">
                <img 
                  src={images[index]} 
                  alt={`Imagem ${index + 1}`} 
                  className="rounded-lg w-full object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  // Dados da fase baseados nos IDs (fallback para desenvolvimento)
  const fallbackPhase = !loading && !phaseData ? {
    title: "Raio-X da Personalidade",
    steps: [
      {
        type: "video",
        title: "Conheça a si mesmo",
        videoId: "dQw4w9WgXcQ", // Placeholder para o vídeo do YouTube
      },
      {
        type: "content",
        title: "Tipos de personalidade",
        text: `A nossa personalidade é formada por traços que nos tornam únicos! 🤩 

Existem vários modelos para entender esses traços, como o Big Five (os 5 grandes traços):

1. Abertura a experiências: você é curioso(a) e gosta de novidades?
2. Conscienciosidade: você é organizado(a) e responsável?
3. Extroversão: você ganha energia com outras pessoas?
4. Amabilidade: você se preocupa com os outros?
5. Neuroticismo: você tende a sentir emoções negativas com frequência?

Entender esses aspectos ajuda a conhecer seus pontos fortes e áreas para desenvolver! 💪`,
      },
      {
        type: "quiz",
        title: "Teste seus conhecimentos",
        questions: [
          {
            question: "Qual dessas NÃO é uma dimensão do modelo Big Five?",
            options: [
              "Extroversão",
              "Amabilidade",
              "Motivação", 
              "Abertura a experiências"
            ],
            correctAnswer: 2,
          },
          {
            question: "Pessoas com alta conscienciosidade tendem a ser:",
            options: [
              "Muito criativas e artísticas",
              "Organizadas e responsáveis",
              "Extrovertidas e comunicativas",
              "Emocionalmente instáveis"
            ],
            correctAnswer: 1,
          },
        ]
      },
      {
        type: "challenge",
        title: "Desafio Prático",
        description: "Identifique seus 3 principais pontos fortes e 2 áreas que você gostaria de desenvolver. Compartilhe com alguém de confiança e peça feedback.",
        reflection: "O que você descobriu sobre si mesmo(a) com esse exercício? O feedback que recebeu confirmou sua percepção?"
      },
      {
        type: "completion",
        title: "Fase completa!",
        xpGained: 100,
      }
    ]
  } : phase;

  // Usar os dados da fase do backend ou o fallback
  const phaseToUse = phaseData ? phase : fallbackPhase;
  const currentStep = phaseToUse.steps[step] || null;

  // Controladores de navegação
  const goToNextStep = () => {
    if (step < phaseToUse.steps.length - 1) {
      setStep(step + 1);
      // Resetar o índice da pergunta do quiz quando mudar de etapa
      setCurrentQuizQuestion(0);
    } else {
      completePhase();
    }
  };

  const goToPreviousStep = () => {
    if (step > 0) {
      setStep(step - 1);
      setCurrentQuizQuestion(0);
    }
  };

  // Avançar para a próxima pergunta do quiz
  const goToNextQuestion = () => {
    if (currentStep && currentStep.type === "quiz" && currentQuizQuestion < currentStep.questions.length - 1) {
      setCurrentQuizQuestion(prevQuestion => prevQuestion + 1);
    } else {
      // Se for a última pergunta, marcar o quiz como completo
      setQuizCompleted(true);
    }
  };

  // Ao completar uma pergunta do quiz
  const handleAnswerQuestion = (questionIndex: number, correct: boolean) => {
    // Exibir feedback sobre a resposta
    if (correct) {
      toast.success("Resposta correta! 🎉");
    } else {
      toast.error("Resposta incorreta. Tente aprender mais sobre o assunto.");
    }
    
    // Aguardar um momento antes de avançar para a próxima pergunta
    setTimeout(() => {
      goToNextQuestion();
    }, 1000);
  };

  // Ao completar a fase
  const completePhase = () => {
    setShowConfetti(true);
    uiToast({
      title: "Fase concluída! 🎉",
      description: `Você ganhou +${phaseToUse.steps[phaseToUse.steps.length - 1]?.xpGained || 100} XP!`,
    });
    
    setTimeout(() => {
      navigate(`/modulo/${moduleId}`);
    }, 3000);
  };

  // Renderiza o conteúdo com base no tipo do passo atual
  const renderStepContent = () => {
    // Mostrar indicador de carregamento
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-trilha-orange border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando conteúdo...</p>
        </div>
      );
    }
    
    // Se não houver dados ou passos
    if (!currentStep) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600">Nenhum conteúdo disponível para esta fase.</p>
          <Button 
            onClick={() => navigate(`/modulo/${moduleId}`)}
            className="mt-4 bg-trilha-orange text-white hover:bg-trilha-orange/90"
          >
            Voltar ao Módulo
          </Button>
        </div>
      );
    }
    
    switch (currentStep.type) {
      case "video":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{currentStep.title}</h2>
            <p className="text-sm text-gray-800">{currentStep.text}</p>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${currentStep.videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                onPlay={() => setVideoWatched(true)}
              ></iframe>
            </div>
            
            {/* Observações do vídeo */}
            {currentStep.videoNotes && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="font-medium text-amber-800 mb-2">📝 Observações importantes:</h3>
                <div className="text-sm text-amber-700 whitespace-pre-line">
                  {currentStep.videoNotes}
                </div>
              </div>
            )}
            
            <Button 
              onClick={goToNextStep}
              className="w-full bg-trilha-orange text-white hover:bg-trilha-orange/90"
            >
              Continuar
            </Button>
          </div>
        );
        
      case "content":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{currentStep.title}</h2>
            <div className="rounded-lg border bg-white p-4">
              <div className="whitespace-pre-line">
                {currentStep.text && renderContentWithImages(currentStep.text, currentStep.images)}
              </div>
            </div>
            <Button 
              onClick={goToNextStep}
              className="w-full bg-trilha-orange text-white hover:bg-trilha-orange/90"
            >
              Continuar
            </Button>
          </div>
        );
        
      case "quiz":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{currentStep.title}</h2>
            <div className="rounded-lg border bg-white p-4">
              {currentStep.questions.map((question, index) => (
                <div 
                  key={index} 
                  className={index === currentQuizQuestion ? "block" : "hidden"}
                >
                  <div className="mb-2 text-sm text-gray-500">
                    Pergunta {index + 1} de {currentStep.questions.length}
                  </div>
                  <QuizQuestion
                    question={question.question}
                    options={question.options}
                    correctAnswer={question.correctAnswer}
                    onAnswer={(correct) => handleAnswerQuestion(index, correct)}
                  />
                </div>
              ))}
            </div>
            {quizCompleted && (
              <Button 
                onClick={goToNextStep}
                className="w-full bg-trilha-orange text-white hover:bg-trilha-orange/90"
              >
                Continuar
              </Button>
            )}
          </div>
        );
        
      case "challenge":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">{currentStep.title}</h2>
            <div className="rounded-lg border bg-white p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Instruções:</h3>
                <p>{currentStep.description}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Para reflexão:</h3>
                <p className="text-gray-700">{currentStep.reflection}</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="reflection" className="block font-semibold">
                  Compartilhe sua experiência (opcional):
                </label>
                <textarea
                  id="reflection"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-trilha-orange focus:outline-none focus:ring-2 focus:ring-trilha-orange focus:ring-opacity-20"
                  placeholder="Escreva aqui o que você aprendeu..."
                ></textarea>
              </div>
            </div>
            <Button 
              onClick={goToNextStep}
              className="w-full bg-trilha-orange text-white hover:bg-trilha-orange/90"
            >
              Marcar como concluído
            </Button>
          </div>
        );
        
      case "completion":
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="text-6xl">🎉</div>
            <h2 className="text-center text-2xl font-bold">
              {currentStep.title}
            </h2>
            <div className="text-center">
              <p className="text-lg">
                Você ganhou <span className="font-bold text-trilha-orange">+{currentStep.xpGained} XP</span>
              </p>
              <p className="mt-2 text-gray-600">
                Continue sua jornada!
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <Button 
                onClick={() => navigate(`/modulo/${moduleId}`)}
                variant="outline"
                className="border-trilha-orange text-trilha-orange hover:bg-trilha-orange/10"
              >
                Voltar ao Módulo
              </Button>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="bg-trilha-orange text-white hover:bg-trilha-orange/90"
              >
                Página Inicial
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 text-center">
            <p>Conteúdo não disponível</p>
          </div>
        );
    }
  };

  return (
    <div className="pb-16 min-h-screen bg-gray-50">
      <Header title={loading ? "Carregando..." : phaseToUse.title} />

      {/* Barra de progresso - só mostrar se não estiver carregando e tiver passos */}
      {!loading && phaseToUse.steps.length > 0 && (
        <div className="bg-white py-2">
          <div className="container px-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Passo {step + 1} de {phaseToUse.steps.length}</span>
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>{phaseData?.duration || 15} min</span>
              </div>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-trilha-orange transition-all"
                style={{
                  width: `${((step + 1) / phaseToUse.steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="container px-4 py-6">
        {renderStepContent()}
      </div>

      {/* Navegação entre passos - só mostrar se não estiver carregando, tiver passos e não for um passo especial */}
      {!loading && phaseToUse.steps.length > 0 && currentStep && currentStep.type !== "completion" && currentStep.type !== "quiz" && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-between px-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousStep}
            disabled={step === 0}
            className="h-12 w-12 rounded-full border-gray-300 bg-white shadow-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextStep}
            className="h-12 w-12 rounded-full border-trilha-orange bg-white text-trilha-orange shadow-md"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Efeito confetti ao completar */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: [
                  "#F97316",
                  "#FEC6A1",
                  "#000000",
                  "#FFFFFF",
                  "#E5DEFF",
                ][Math.floor(Math.random() * 5)],
                animationDuration: `${Math.random() * 3 + 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default PhaseDetailPage;
