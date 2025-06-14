
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkOnboardingStatus } from "@/services/onboardingService";
import SplashScreen from "@/pages/SplashScreen";
import { useQuery } from "@tanstack/react-query";

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
    staleTime: 5 * 60 * 1000, 
    retry: 1, 
  });

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isError || !authStatus?.session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!authStatus.onboardingCompleted) {
    const allowedOnboardingPaths = ["/onboarding", "/completar-perfil"];
    if (!allowedOnboardingPaths.includes(location.pathname)) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
