
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import { RewardModalProvider } from "@/components/XpRewardModal/RewardModalContext";

// Pages
import SplashScreen from "@/pages/SplashScreen";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import OnboardingPage from "@/pages/OnboardingPage";
import CompleteProfilePage from "@/pages/CompleteProfilePage";
import DashboardPage from "@/pages/DashboardPage";
import ModulesPage from "@/pages/ModulesPage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import PhaseDetailPage from "@/pages/PhaseDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import { VocationalTestPage } from "@/pages/VocationalTestPage";
import JournalPage from "@/pages/JournalPage";
import TutorPage from "@/pages/TutorPage";
import PomodoroPage from "@/pages/PomodoroPage";
import SocialPage from "@/pages/SocialPage";
import LabPage from "@/pages/LabPage";
import AdminPage from "@/pages/AdminPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <RewardModalProvider>
          <Router>
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/completar-perfil"
                element={
                  <ProtectedRoute>
                    <CompleteProfilePage />
                  </ProtectedRoute>
                }
              />
              
              {/* Rotas que usam o Layout com BottomNavigation */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/modulos" element={<ModulesPage />} />
                        <Route path="/modulo/:id" element={<ModuleDetailPage />} />
                        <Route path="/modulo/:moduleId/fase/:id" element={<PhaseDetailPage />} />
                        <Route path="/perfil" element={<ProfilePage />} />
                        <Route path="/editar-perfil" element={<EditProfilePage />} />
                        <Route path="/teste-vocacional" element={<VocationalTestPage />} />
                        <Route path="/diario" element={<JournalPage />} />
                        <Route path="/tutor" element={<TutorPage />} />
                        <Route path="/pomodoro" element={<PomodoroPage />} />
                        <Route path="/social" element={<SocialPage />} />
                        <Route path="/lab" element={<LabPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/configuracoes" element={<SettingsPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </Router>
        </RewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
