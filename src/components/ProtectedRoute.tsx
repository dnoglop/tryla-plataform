
import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { checkOnboardingStatus } from '@/services/onboardingService';
import SplashScreen from '@/pages/SplashScreen';

const ProtectedRoute = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Verifica a sessão
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Verifica se o onboarding foi completo
        const completed = await checkOnboardingStatus(session.user.id);
        setOnboardingCompleted(completed);
      }

      setLoading(false);
    };

    checkAuthAndOnboarding();

    // Ouve por mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        const completed = await checkOnboardingStatus(session.user.id);
        setOnboardingCompleted(completed);
      } else {
        setOnboardingCompleted(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  // Se o usuário está logado mas não completou o onboarding
  if (session && onboardingCompleted === false) {
    return <Navigate to="/onboarding" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
