import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";
import SplashScreen from "@/pages/SplashScreen";
import { useQuery } from "@tanstack/react-query";

// A função de busca permanece a mesma, está perfeita.
const fetchUserAuthStatus = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Erro ao buscar sessão:", sessionError.message);
    throw new Error("Erro ao buscar sessão");
  }

  if (!session?.user) {
    return { session: null, onboardingCompleted: false };
  }

  const onboardingCompleted = await checkOnboardingStatus(session.user.id);

  return { session, onboardingCompleted };
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();

  const {
    data: authStatus,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["userAuthStatus"],
    queryFn: fetchUserAuthStatus,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache, bom
    retry: 1, 
  });

  // Estado de carregamento: mostra uma tela de splash. Perfeito.
  if (isLoading) {
    return <SplashScreen />;
  }

  // Se houver erro ou não houver sessão, redireciona para o login. Perfeito.
  if (isError || !authStatus?.session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // A LÓGICA CHAVE DE REDIRECIONAMENTO
  if (!authStatus.onboardingCompleted) {
    // Definimos todos os caminhos que um usuário EM PROCESSO de onboarding pode acessar.
    const allowedOnboardingPaths = [
        "/onboarding", 
        "/completar-perfil",
        "/minha-trilha" // <-- ADICIONADO: Permite que o usuário veja o resultado da trilha.
    ];
    
    // Se o usuário tentar acessar qualquer outra página protegida,
    // mas o onboarding não está completo, ele é forçado a voltar para o onboarding.
    if (!allowedOnboardingPaths.includes(location.pathname)) {
      // Redireciona para o início do fluxo de onboarding.
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Se todas as verificações acima passaram, o usuário tem permissão para ver a página.
  return <>{children}</>;
};

export default ProtectedRoute;