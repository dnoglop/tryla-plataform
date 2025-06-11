import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/complete-profile");
    }
  };

  const onboardingSteps = [
    {
      title: "Bem-vindo(a) à Tryla!",
      subtitle: "Sua jornada de crescimento pessoal começa agora",
      description: "Prepare-se para descobrir seus talentos, desenvolver novas habilidades e construir o futuro que você sempre sonhou.",
      icon: <img src="https://i.imgur.com/TmfqRTD.gif" alt="Ícone de Foguete" className="w-24 h-24 mx-auto"/>,
      quote: "'O futuro pertence àqueles que acreditam na beleza de seus sonhos.'",
    },
    {
      title: "Defina os seus objetivos",
      subtitle: "Cada grande jornada começa com um primeiro passo",
      description: "Aqui você vai descobrir seus pontos fortes, definir metas claras e criar um plano personalizado para alcançar seus objetivos profissionais.",
      icon: <img src="https://i.imgur.com/TmfqRTD.gif" alt="Ícone de Alvo" className="w-24 h-24 mx-auto"/>,
      quote: "'O sucesso é a soma de pequenos esforços repetidos dia após dia.'",
    },
    {
      title: "Conecte-se com a comunidade",
      subtitle: "Juntos chegamos mais longe!",
      description: "Faça parte de uma comunidade inspiradora de jovens determinados a construir um futuro brilhante. Compartilhe experiências e cresça junto com outros.",
      icon: <img src="https://i.imgur.com/TmfqRTD.gif" alt="Ícone de Comunidade" className="w-24 h-24 mx-auto"/>,
      quote: "'Sozinhos podemos fazer tão pouco; juntos podemos fazer muito.'",
    },
  ];

  const currentStepData = onboardingSteps[currentStep - 1];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-lg mx-auto w-full">
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full mx-2 transition-all duration-300 ${
                step <= currentStep ? "bg-trilha-orange" : "bg-slate-300"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 mb-6 text-center">
          <div className="flex justify-center mb-6">{currentStepData.icon}</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">{currentStepData.title}</h1>
          <p className="text-lg font-semibold text-trilha-orange mb-4">{currentStepData.subtitle}</p>
          <p className="text-slate-600 leading-relaxed">{currentStepData.description}</p>
          <div className="bg-slate-50 rounded-xl p-4 mt-6 border border-slate-200">
            <p className="text-sm italic text-slate-700">{currentStepData.quote}</p>
          </div>
        </div>

        <Button
          onClick={handleNext}
          className="w-full bg-trilha-orange hover:bg-trilha-orange/90 text-white font-semibold py-4 text-lg rounded-xl shadow-sm"
        >
          {currentStep < 3 ? (
            <>Continuar <ArrowRight className="ml-2 h-5 w-5" /></>
          ) : (
            <>Vamos começar! <Sparkles className="ml-2 h-5 w-5" /></>
          )}
        </Button>
        <p className="text-sm text-slate-500 mt-4 text-center font-medium">{currentStep} de 3</p>
      </div>
    </div>
  );
};

export default OnboardingPage;