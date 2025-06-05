import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SplashScreen from '@/pages/SplashScreen'; // Usamos o seu splash como tela de carregamento

const ProtectedRoute = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica a sessão uma vez no início
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Ouve por mudanças no estado de autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Limpa a inscrição quando o componente for desmontado
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    // Enquanto verificamos se o usuário está logado, mostramos a tela de splash
    // Isso evita o "piscar" da tela de login
    return <SplashScreen />;
  }

  if (!session) {
    // Se não houver sessão após o carregamento, redireciona para o login
    return <Navigate to="/login" />;
  }

  // Se houver sessão, renderiza o conteúdo da rota filha (a página real)
  return <Outlet />;
};

export default ProtectedRoute;