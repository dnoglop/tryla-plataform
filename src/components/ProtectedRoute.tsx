// src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";
import SplashScreen from "@/pages/SplashScreen";
import { useQuery } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";

// <<< MUDANÇA PRINCIPAL: FUNÇÃO DE BUSCA UNIFICADA >>>
// Esta função agora é a única fonte da verdade para o estado de autenticação e onboarding.
// O React Query irá gerenciá-la para nós.
const fetchUserAuthStatus = async () => {
  // 1. Pega a sessão atual do usuário
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    // Se houver um erro de rede ou do Supabase, a query falhará.
    console.error("Erro ao buscar sessão:", sessionError.message);
    throw new Error("Erro ao buscar sessão");
  }

  // Se não há usuário logado, retornamos um estado nulo.
  if (!session?.user) {
    return { session: null, onboardingCompleted: false };
  }

  // 2. Se há um usuário, verificamos o status do onboarding dele.
  const onboardingCompleted = await checkOnboardingStatus(session.user.id);

  // Retornamos um objeto com todos os dados necessários.
  return { session, onboardingCompleted };
};

const ProtectedRoute = () => {
  const location = useLocation();

  // <<< MUDANÇA PRINCIPAL: SUBSTITUIÇÃO DE useEffect POR useQuery >>>
  // Usamos useQuery para gerenciar o estado de carregamento, erros e os dados em si.
  const {
    data: authStatus,
    isLoading,
    isError,
  } = useQuery({
    // A queryKey é um nome único para esta busca de dados.
    // Usaremos esta chave para "avisar" ao React Query para buscar os dados novamente.
    queryKey: ["userAuthStatus"],
    queryFn: fetchUserAuthStatus,
    staleTime: 5 * 60 * 1000, // Considera os dados "frescos" por 5 minutos
    retry: 1, // Tenta novamente apenas 1 vez em caso de falha de rede
  });

  // Enquanto a query estiver carregando, mostramos a tela de splash.
  if (isLoading) {
    return <SplashScreen />;
  }

  // Se a query deu erro ou não retornou uma sessão, redireciona para o login.
  if (isError || !authStatus?.session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se o onboarding não foi completado, redireciona para a página de onboarding.
  if (!authStatus.onboardingCompleted) {
    // Exceção: permite que o usuário acesse as próprias páginas de onboarding.
    const allowedOnboardingPaths = ["/onboarding", "/complete-profile"];
    if (!allowedOnboardingPaths.includes(location.pathname)) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Se todas as verificações passaram, renderiza a página filha (Dashboard, Perfil, etc.).
  return <Outlet />;
};

export default ProtectedRoute;
