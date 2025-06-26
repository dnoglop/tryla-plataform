// ARQUIVO: src/App.tsx (VERSÃO FINAL COM LAYOUT CORRETO APLICADO)

import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

// Providers e Componentes Globais
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PWAPrompt from "./components/PWAPrompt";
import { RewardModalProvider } from "./components/XpRewardModal/RewardModalContext";
import Layout from "./components/Layout";
import ScrollToTop from './components/ScrollToTop';

// Importações de todas as Páginas
import SplashScreen from "./pages/SplashScreen";
import Index from "./pages/Index";
import ProfilePage from "./pages/ProfilePage";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import PhaseDetailPage from "./pages/PhaseDetailPage";
import SocialPage from "./pages/SocialPage";
import LabPage from "./pages/LabPage";
import SettingsPage from "./pages/SettingsPage";
import { VocationalTestPage } from "./pages/VocationalTestPage";
import TutorPage from "./pages/TutorPage";
import PomodoroPage from "./pages/PomodoroPage";
import AdminPage from "./pages/AdminPage";
import EditProfilePage from "./pages/EditProfilePage";
import JournalPage from "./pages/JournalPage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import AuthPage from "./pages/AuthPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RewardModalProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* --- ROTAS PÚBLICAS (sem layout padrão) --- */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/cadastro" element={<AuthPage />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />}
              <Route path="/atualizar-senha" element={<UpdatePasswordPage />} />

              {/* --- ROTAS DE ONBOARDING (sem layout padrão) --- */}
              <Route
                path="/onboarding"
                element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>}
              />

              {/* --- ROTAS PROTEGIDAS QUE USAM O LAYOUT PADRÃO --- */}
              <Route path="/inicio" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Layout><AdminPage /></Layout></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><Layout><SocialPage /></Layout></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><Layout><LabPage /></Layout></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
              <Route path="/editar-perfil" element={<ProtectedRoute><Layout><EditProfilePage /></Layout></ProtectedRoute>} />
              <Route path="/modulos" element={<ProtectedRoute><Layout><ModulesPage /></Layout></ProtectedRoute>} />
              <Route path="/diario" element={<ProtectedRoute><Layout><JournalPage /></Layout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
              <Route path="/teste-vocacional" element={<ProtectedRoute><Layout><VocationalTestPage /></Layout></ProtectedRoute>} />
              <Route path="/tutor" element={<ProtectedRoute><Layout><TutorPage /></Layout></ProtectedRoute>} />
              <Route path="/pomodoro" element={<ProtectedRoute><Layout><PomodoroPage /></Layout></ProtectedRoute>} />

              {/* --- ROTAS DE TELA CHEIA (NÃO usam o Layout) --- */}
              <Route
                path="/modulo/:id"
                element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>}
              />
              <Route
                path="/modulo/:moduleId/fase/:id"
                element={<ProtectedRoute><PhaseDetailPage /></ProtectedRoute>}
              />

              {/* --- ROTAS DE FALLBACK --- */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Routes>

            <Toaster />
            <PWAPrompt />
          </Router>
        </RewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;