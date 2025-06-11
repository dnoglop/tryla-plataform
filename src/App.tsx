import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Componentes e Layout
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster } from "sonner";

// Páginas
import SplashScreen from "./pages/SplashScreen";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import PhaseDetailPage from "./pages/PhaseDetailPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import JournalPage from "./pages/JournalPage";
import TutorPage from "./pages/TutorPage";
import LabPage from "./pages/LabPage";
import { VocationalTestPage } from "./pages/VocationalTestPage";
import SocialPage from "./pages/SocialPage";
import { PomodoroPage } from "./pages/PomodoroPage";
import OnboardingPage from "./pages/OnboardingPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          queryClient.invalidateQueries({ queryKey: ["userAuthStatus"] });
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />

        {/* --- Rotas Protegidas --- */}
        <Route element={<ProtectedRoute />}>
          {/* Rotas de Onboarding (acessíveis apenas a usuários logados sem onboarding) */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />

          {/* Rotas principais com o Layout (disponíveis após o onboarding) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modulos" element={<ModulesPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/diario" element={<JournalPage />} />
            <Route path="/tutor" element={<TutorPage />} />
          </Route>

          {/* Rotas de tela cheia (disponíveis após o onboarding) */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/modulo/:id" element={<ModuleDetailPage />} />
          <Route path="/fase/:moduleId/:phaseId" element={<PhaseDetailPage />} />
          <Route path="/lab/pomodoro" element={<PomodoroPage />} />
          <Route path="/teste-vocacional" element={<VocationalTestPage />} />
        </Route>
      </Routes>
      <Toaster position="top-center" closeButton />
    </Router>
  );
}

export default App;