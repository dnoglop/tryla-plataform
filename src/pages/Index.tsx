
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Flame, TrendingUp } from "lucide-react";

const motivationalPhrases = [
  "Seja a mudança que você quer ver no mundo.",
  "Grandes realizações são feitas um passo de cada vez.",
  "O crescimento pessoal é uma jornada constante.",
  "Quem se conhece melhor, se expressa melhor.",
  "A empatia é a ponte que nos conecta."
];

const Index = () => {
  const navigate = useNavigate();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const { data: dashboardData, isLoading } = useDashboardData();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => 
        prevIndex >= motivationalPhrases.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNextPhrase = () => {
    setCurrentPhraseIndex((prevIndex) => 
      prevIndex >= motivationalPhrases.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleContinueJourney = () => {
    navigate("/modulos");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-background p-6">
        {/* Header Section */}
        <div className="text-center mb-8 pt-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center mx-auto">
            <img 
              src="https://i.imgur.com/TmfqRTD.gif" 
              alt="Logo Tryla" 
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            Olá, {dashboardData?.profile?.full_name || 'Aprendiz'}! 👋
          </h1>
          <p className="text-muted-foreground">Bem-vindo de volta à sua jornada</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{dashboardData?.profile?.xp || 0}</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{dashboardData?.completedModulesCount || 0}</p>
              <p className="text-xs text-muted-foreground">Módulos</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{dashboardData?.profile?.streak_days || 0}</p>
              <p className="text-xs text-muted-foreground">Sequência</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">#{dashboardData?.userRank || '-'}</p>
              <p className="text-xs text-muted-foreground">Ranking</p>
            </CardContent>
          </Card>
        </div>

        {/* Motivational Quote Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-orange-100">
          <div className="h-20 flex items-center justify-center mb-4">
            {motivationalPhrases.map((phrase, index) => (
              <p 
                key={index} 
                className={`absolute transition-all duration-700 ease-in-out text-lg text-center max-w-xs text-foreground font-medium
                  ${currentPhraseIndex === index 
                    ? "opacity-100 transform-none" 
                    : "opacity-0 translate-y-8"}
                `}
              >
                "{phrase}"
              </p>
            ))}
          </div>
          
          <div className="flex justify-center space-x-2 mb-6">
            {motivationalPhrases.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 w-2 rounded-full transition-all duration-500 ${
                  currentPhraseIndex === i 
                    ? 'bg-orange-500 scale-110' 
                    : 'bg-orange-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-1 flex items-end pb-8">
          <Button 
            onClick={handleContinueJourney}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-lg font-semibold shadow-lg"
            size="lg"
          >
            Continuar minha jornada
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
