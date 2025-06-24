// ARQUIVO: src/App.tsx (VERSÃO FINAL COMPLETA)

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
import Layout from "./components/Layout"; // O nosso Layout simplificado
import PWAPrompt from "./components/PWAPrompt";
import { RewardModalProvider } from "./components/XpRewardModal/RewardModalContext";

// Importações de todas as Páginas
import SplashScreen from "./pages/SplashScreen";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
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
import CompleteProfilePage from "./pages/CompleteProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import JournalPage from "./pages/JournalPage";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RewardModalProvider>
          <Router>
            <Routes>
              {/* --- ROTAS PÚBLICAS --- */}
              {/* Estas páginas são de tela cheia e não usam o Layout padrão. */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<SignupPage />} />
              <Route path="/cadastro" element={<SignupPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/completar-perfil" element={<CompleteProfilePage />} />

              {/* --- ROTAS PROTEGIDAS --- */}

              {/* PÁGINAS QUE USAM O LAYOUT PADRÃO (com BottomNavigation) */}
              <Route path="/inicio" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
              <Route path="/modulos" element={<ProtectedRoute><Layout><ModulesPage /></Layout></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><Layout><SocialPage /></Layout></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><Layout><LabPage /></Layout></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
              <Route path="/editar-perfil" element={<ProtectedRoute><Layout><EditProfilePage /></Layout></ProtectedRoute>} />
              <Route path="/diario" element={<ProtectedRoute><Layout><JournalPage /></Layout></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
              <Route path="/teste-vocacional" element={<ProtectedRoute><Layout><VocationalTestPage /></Layout></ProtectedRoute>} />
              <Route path="/tutor" element={<ProtectedRoute><Layout><TutorPage /></Layout></ProtectedRoute>} />
              <Route path="/pomodoro" element={<ProtectedRoute><Layout><PomodoroPage /></Layout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Layout><AdminPage /></Layout></ProtectedRoute>} />

              {/* PÁGINAS DE TELA CHEIA (NÃO usam o componente Layout) */}
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

            {/* Componentes globais que aparecem em todas as páginas */}
            <Toaster />
            <PWAPrompt />
          </Router>
        </RewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;