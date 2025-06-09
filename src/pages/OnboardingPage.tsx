
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Users } from "lucide-react";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/complete-profile');
    }
  };

  const onboardingSteps = [
    {
      title: "Bem-vindo(a) à Tryla!",
      subtitle: "Sua jornada de crescimento pessoal começa agora",
      description: "Prepare-se para descobrir seus talentos, desenvolver novas habilidades e construir o futuro que você sempre sonhou.",
      icon: <Sparkles className="h-20 w-20 text-white" />,
      bgGradient: "from-trilha-orange via-orange-400 to-red-400",
      quote: "\"O futuro pertence àqueles que acreditam na beleza de seus sonhos.\""
    },
    {
      title: "Defina Seus Objetivos",
      subtitle: "Cada grande jornada começa com um primeiro passo",
      description: "Aqui você vai descobrir seus pontos fortes, definir metas claras e criar um plano personalizado para alcançar seus objetivos profissionais.",
      icon: <Target className="h-20 w-20 text-white" />,
      bgGradient: "from-blue-400 via-trilha-orange to-purple-400",
      quote: "\"O sucesso é a soma de pequenos esforços repetidos dia após dia.\""
    },
    {
      title: "Conecte-se com a Comunidade",
      subtitle: "Juntos chegamos mais longe",
      description: "Faça parte de uma comunidade inspiradora de jovens determinados a construir um futuro brilhante. Compartilhe experiências e cresça junto com outros.",
      icon: <Users className="h-20 w-20 text-white" />,
      bgGradient: "from-green-400 via-trilha-orange to-cyan-400",
      quote: "\"Sozinhos podemos fazer tão pouco; juntos podemos fazer muito.\""
    }
  ];

  const currentStepData = onboardingSteps[currentStep - 1];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${currentStepData.bgGradient} p-6 relative overflow-hidden`}>
      {/* Background Pattern - matching the style from other pages */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-bounce-slow"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full animation-delay-200 animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full animation-delay-400 animate-bounce-slow"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-white rounded-full animation-delay-600 animate-bounce-slow"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full text-center text-white animate-fade-in">
        {/* Logo */}
        <div className="mb-8 animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <img 
              src="https://i.imgur.com/TmfqRTD.gif" 
              alt="Logo Tryla" 
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8 animate-slide-up">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-4 h-4 rounded-full mx-2 transition-all duration-500 ${
                step <= currentStep 
                  ? 'bg-white scale-110 shadow-lg' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-8 animate-scale-in">
          <div className="p-6 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 shadow-xl">
            {currentStepData.icon}
          </div>
        </div>

        {/* Content */}
        <div className="animate-slide-up">
          <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">{currentStepData.title}</h1>
          <p className="text-xl font-semibold mb-6 opacity-90 drop-shadow-md">{currentStepData.subtitle}</p>
          <p className="text-lg mb-8 opacity-80 leading-relaxed drop-shadow-sm max-w-md mx-auto">{currentStepData.description}</p>
        </div>

        {/* Quote */}
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl animate-scale-in">
          <p className="text-base italic opacity-90 drop-shadow-sm">{currentStepData.quote}</p>
        </div>

        {/* Button */}
        <div className="animate-slide-up">
          <Button
            onClick={handleNext}
            className="w-full bg-white text-gray-800 hover:bg-white/90 font-bold py-4 text-xl rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-white/20"
          >
            {currentStep < 3 ? (
              <>
                Continuar
                <ArrowRight className="ml-3 h-6 w-6" />
              </>
            ) : (
              <>
                Vamos começar!
                <Sparkles className="ml-3 h-6 w-6" />
              </>
            )}
          </Button>
        </div>

        {/* Step indicator text */}
        <p className="text-sm opacity-70 mt-6 font-medium drop-shadow-sm">{currentStep} de 3</p>
      </div>
    </div>
  );
};

export default OnboardingPage;
