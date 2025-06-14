
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
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
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modulos"
                element={
                  <ProtectedRoute>
                    <ModulesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modulo/:id"
                element={
                  <ProtectedRoute>
                    <ModuleDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modulo/:moduleId/fase/:id"
                element={
                  <ProtectedRoute>
                    <PhaseDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editar-perfil"
                element={
                  <ProtectedRoute>
                    <EditProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teste-vocacional"
                element={
                  <ProtectedRoute>
                    <VocationalTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/diario"
                element={
                  <ProtectedRoute>
                    <JournalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tutor"
                element={
                  <ProtectedRoute>
                    <TutorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pomodoro"
                element={
                  <ProtectedRoute>
                    <PomodoroPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/social"
                element={
                  <ProtectedRoute>
                    <SocialPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lab"
                element={
                  <ProtectedRoute>
                    <LabPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </RewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
