
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => 
        prevIndex >= motivationalPhrases.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleNextPhrase = () => {
    setCurrentPhraseIndex((prevIndex) => 
      prevIndex >= motivationalPhrases.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#FFDCCC] to-white p-6 text-center">
      <div className="mb-8">
        <div className="w-32 h-32 mb-3 flex items-center justify-center">
          <img 
            src="https://i.imgur.com/TmfqRTD.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-3xl font-bold text-[#e36322] mb-2">Tryla</h1>
        <p className="text-gray-500">Sua jornada de desenvolvimento pessoal</p>
      </div>
      
      <div className="h-32 flex items-center justify-center mb-8">
        {motivationalPhrases.map((phrase, index) => (
          <p 
            key={index} 
            className={`absolute transition-all duration-700 ease-in-out text-xl text-center max-w-xs text-gray-700 font-medium
              ${currentPhraseIndex === index 
                ? "opacity-100 transform-none" 
                : "opacity-0 translate-y-8"}
            `}
          >
            "{phrase}"
          </p>
        ))}
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-center space-x-2 mb-8">
          {motivationalPhrases.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                currentPhraseIndex === i 
                  ? 'bg-[#e36322] scale-110' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button 
          onClick={handleGetStarted}
          className="bg-[#e36322] hover:bg-[#d15a1f] text-white"
        >
          Começar
        </Button>
      </div>
    </div>
  );
};

export default Index;
