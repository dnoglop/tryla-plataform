
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Users } from "lucide-react";
import { completeOnboarding } from "@/services/onboardingService";
import { toast } from "sonner";

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
      icon: <Sparkles className="h-16 w-16 text-white" />,
      bgGradient: "from-orange-400 via-red-400 to-pink-400",
      quote: "\"O futuro pertence àqueles que acreditam na beleza de seus sonhos.\""
    },
    {
      title: "Defina Seus Objetivos",
      subtitle: "Cada grande jornada começa com um primeiro passo",
      description: "Aqui você vai descobrir seus pontos fortes, definir metas claras e criar um plano personalizado para alcançar seus objetivos profissionais.",
      icon: <Target className="h-16 w-16 text-white" />,
      bgGradient: "from-blue-400 via-purple-400 to-indigo-400",
      quote: "\"O sucesso é a soma de pequenos esforços repetidos dia após dia.\""
    },
    {
      title: "Conecte-se com a Comunidade",
      subtitle: "Juntos chegamos mais longe",
      description: "Faça parte de uma comunidade inspiradora de jovens determinados a construir um futuro brilhante. Compartilhe experiências e cresça junto com outros.",
      icon: <Users className="h-16 w-16 text-white" />,
      bgGradient: "from-green-400 via-teal-400 to-cyan-400",
      quote: "\"Sozinhos podemos fazer tão pouco; juntos podemos fazer muito.\""
    }
  ];

  const currentStepData = onboardingSteps[currentStep - 1];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${currentStepData.bgGradient} p-6 relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-md w-full text-center text-white">
        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                step <= currentStep ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
            {currentStepData.icon}
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold mb-3">{currentStepData.title}</h1>
        <p className="text-xl font-medium mb-4 opacity-90">{currentStepData.subtitle}</p>
        <p className="text-lg mb-8 opacity-80 leading-relaxed">{currentStepData.description}</p>

        {/* Quote */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8 border border-white/20">
          <p className="text-sm italic opacity-90">{currentStepData.quote}</p>
        </div>

        {/* Button */}
        <Button
          onClick={handleNext}
          className="w-full bg-white text-gray-800 hover:bg-white/90 font-semibold py-3 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
        >
          {currentStep < 3 ? (
            <>
              Continuar
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          ) : (
            "Vamos começar!"
          )}
        </Button>

        {/* Step indicator text */}
        <p className="text-sm opacity-60 mt-4">{currentStep} de 3</p>
      </div>
    </div>
  );
};

export default OnboardingPage;
