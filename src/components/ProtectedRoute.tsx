// src/components/ProtectedRoute.tsx

import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { checkOnboardingStatus } from '@/services/onboardingService';
import SplashScreen from '@/pages/SplashScreen';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

const ProtectedRoute = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let invalidated = false; 

    const setupAuthListener = async () => {
      // 1. Pega a sessão atual do localStorage
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
          console.error("Erro inicial ao buscar sessão:", sessionError.message);
          setLoading(false);
          return;
      }
      
      setSession(initialSession);

      if (initialSession?.user) {
        const completed = await checkOnboardingStatus(initialSession.user.id);
        setOnboardingCompleted(completed);
      }
      
      setLoading(false);

      // 2. Configura o "ouvinte" para mudanças futuras
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          
          if (!currentSession && session && !invalidated) { // Verifica se a sessão anterior existia
            invalidated = true;
            toast.info("Sua sessão expirou. Por favor, faça login novamente.");
          }
          
          setSession(currentSession);

          if (currentSession?.user) {
            const completed = await checkOnboardingStatus(currentSession.user.id);
            setOnboardingCompleted(completed);
          } else {
            setOnboardingCompleted(false);
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    };

    setupAuthListener();
    
  }, []); // Array de dependências vazio para rodar apenas uma vez

  if (loading) {
    return <SplashScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!onboardingCompleted) {
    const allowedOnboardingPaths = ['/onboarding', '/complete-profile'];
    if (!allowedOnboardingPaths.includes(location.pathname)) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;