
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const onboardingCompleted = await checkOnboardingStatus(session.user.id);
        if (onboardingCompleted) {
          // User is authenticated and onboarded, redirect to home
          navigate("/inicio", { replace: true });
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const handleStart = async () => {
    setFadeOut(true);
    
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const onboardingCompleted = await checkOnboardingStatus(session.user.id);
        if (onboardingCompleted) {
          navigate("/inicio");
        } else {
          navigate("/onboarding");
        }
      } else {
        navigate("/login");
      }
    }, 500);
  };

  return (
    <div 
      className={`min-h-screen bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center justify-center space-y-8 p-6 max-w-md mx-auto text-center">
        <div className="w-68 h-68 flex items-center justify-center">
          <img 
            src="https://i.imgur.com/sxJhyH8.gif" 
            alt="Logo Tryla" 
            className="w-full h-auto"
          />
        </div>
        
        <p className="text-muted-foreground">
          Bem-vindo à sua jornada de autoconhecimento e desenvolvimento pessoal.
        </p>
        
        <Button 
          onClick={handleStart}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 rounded-full text-lg"
        >
          Começar a minha jornada
        </Button>
      </div>
    </div>
  );
};

export default SplashScreen;
