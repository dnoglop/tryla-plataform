
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  const [showLogo, setShowLogo] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticação do usuário
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

  // Efeito para animação de frases motivacionais
  useEffect(() => {
    const logoTimeout = setTimeout(() => {
      setShowLogo(false);
    }, 2000);

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => 
        prevIndex >= motivationalPhrases.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    const navigationTimeout = setTimeout(() => {
      if (isAuthenticated) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    }, 8000);

    return () => {
      clearTimeout(logoTimeout);
      clearInterval(interval);
      clearTimeout(navigationTimeout);
    };
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white p-6 text-center">
      <div className={`transition-all duration-1000 ${showLogo ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        <div className="text-6xl mb-3">🔶</div>
        <h1 className="text-3xl font-bold text-trilha-orange mb-2">Na Trilha</h1>
        <p className="text-gray-500">Sua jornada de desenvolvimento pessoal</p>
      </div>
      
      <div className={`transition-all duration-1000 h-60 flex items-center justify-center ${showLogo ? "opacity-0" : "opacity-100"}`}>
        {motivationalPhrases.map((phrase, index) => (
          <p 
            key={index} 
            className={`absolute transition-all duration-1000 text-xl text-center max-w-xs text-gray-700 font-medium
              ${currentPhraseIndex === index ? "opacity-100 transform-none" : "opacity-0 translate-y-8"}
            `}
          >
            "{phrase}"
          </p>
        ))}
      </div>
      
      <div className={`mt-8 transition-all duration-1000 ${showLogo ? "opacity-0" : "opacity-100"}`}>
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className={`h-2 w-2 rounded-full transition-all ${currentPhraseIndex % 3 === i ? 'bg-trilha-orange' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
