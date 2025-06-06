import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

// Ícones e Componentes
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StartScreen } from "../components/StartScreen";
import { QuizScreen } from "../components/QuizScreen";
import { PersonalInfoScreen } from "../components/PersonalInfoScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import { ResultScreen } from "../components/ResultScreen";
// Dados e Serviços
import { questions } from "../data/questions";
import { getFinalAIAnalysis } from "../lib/geminiService";
import { getProfile, Profile } from "@/services/profileService";

// Esqueleto de carregamento que imita o novo layout
const VocationalTestSkeleton = () => (
    <div className="min-h-screen w-full bg-slate-100 animate-pulse">
        <header className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48 bg-slate-200" />
                    </div>
                </div>
                <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
            </div>
        </header>
        <div className="flex items-center justify-center p-4">
            <Skeleton className="h-96 w-full max-w-2xl rounded-2xl bg-slate-200" />
        </div>
    </div>
);


// Tipos
type Screen = "start" | "quiz" | "personal-info" | "loading" | "result";
type Scores = Record<"R" | "I" | "A" | "S" | "E" | "C", number>;

export function VocationalTestPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [screen, setScreen] = useState<Screen>("start");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Scores>({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
  const [result, setResult] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const userProfile = await getProfile(user.id);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("Erro ao carregar perfil para o Teste Vocacional:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchUserProfile();
  }, []);

  const handleStart = () => setScreen("quiz");

  const handleRestart = () => {
    // Reseta todos os estados para o início
    setScreen("start");
    setCurrentQuestionIndex(0);
    setScores({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
    setResult("");
  };

  const handleAnswer = (value: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    setScores(prev => ({ ...prev, [currentQuestion.type]: prev[currentQuestion.type] + value }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setScreen("personal-info");
    }
  };

  const handleFinish = async (hobbies: string) => {
    setScreen("loading");
    const aiResult = await getFinalAIAnalysis(scores, hobbies);
    setResult(aiResult);
    setScreen("result");
  };

  const renderScreen = () => {
    switch (screen) {
      case "start":
        return <StartScreen onStart={handleStart} />;
      case "quiz":
        const progress = (currentQuestionIndex / questions.length) * 100;
        return <QuizScreen question={questions[currentQuestionIndex]} onAnswer={handleAnswer} progress={progress} />;
      case "personal-info":
        return <PersonalInfoScreen onSubmit={handleFinish} />;
      case "loading":
        return <LoadingScreen />;
      case "result":
        return <ResultScreen markdownContent={result} onRestart={handleRestart} />;
      default:
        return <StartScreen onStart={handleStart} />;
    }
  };

  if (isLoading || !profile) {
    return <VocationalTestSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-100">
      {/* O HEADER AGORA FICA FORA DA LÓGICA DE TROCA DE TELA */}
      <header className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-transform hover:scale-110 active:scale-95"
                    aria-label="Voltar"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800">Oráculo Vocacional</h1>
                </div>
            </div>
            <Link to="/perfil">
                <img
                    src={profile.avatar_url || ''}
                    alt="Foto do perfil"
                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md transition-transform hover:scale-110"
                />
            </Link>
        </div>
      </header>
      
      {/* Apenas o conteúdo principal é trocado */}
      <main className="flex items-center justify-center p-4">
        <div className="container mx-auto max-w-2xl">
            {renderScreen()}
        </div>
      </main>
    </div>
  );
}