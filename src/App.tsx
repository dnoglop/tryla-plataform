
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// Componentes e Layout
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster, toast } from "sonner";
import { CheckCircle, AlertTriangle, Info, XCircle, Loader2 } from 'lucide-react';

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
  // Opcional: Lógica para adicionar sons aos toasts
  useEffect(() => {
    // Armazena as funções originais para não perdê-las
    const originalSuccess = toast.success;
    const originalError = toast.error;

    // Função para tocar som
    const playSound = (soundFile: string) => {
      // Para funcionar, crie uma pasta `public/sounds` 
      // e adicione os arquivos de áudio nela (ex: success.mp3)
      try {
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.play().catch(e => console.error("Erro ao tocar som:", e));
      } catch(e) {
        console.log("Não foi possível tocar o som (ambiente de servidor, talvez).")
      }
    };

    // Sobrescreve a função toast.success globalmente
    toast.success = (message, options) => {
      playSound('success.mp3'); // Toca o som de sucesso
      return originalSuccess(message, options);
    };

    // Sobrescreve a função toast.error globalmente
    toast.error = (message, options) => {
      playSound('error.mp3'); // Toca o som de erro
      return originalError(message, options);
    };

    // Limpeza: restaura as funções originais quando o componente App é desmontado
    return () => {
      toast.success = originalSuccess;
      toast.error = originalError;
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />

        {/* --- Rotas de Onboarding (após login) --- */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/complete-profile" element={<CompleteProfilePage />} />

        {/* --- Rotas Protegidas --- */}
        <Route element={<ProtectedRoute />}>
          {/* Rotas com o Layout (rodapé) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modulos" element={<ModulesPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/lab" element={<LabPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            
            <Route path="/diario" element={<JournalPage />} />
            <Route path="/tutor" element={<TutorPage />} />
          </Route>

          {/* Rotas sem o Layout (tela cheia) */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/modulo/:id" element={<ModuleDetailPage />} />
          <Route path="/fase/:moduleId/:phaseId" element={<PhaseDetailPage />} />
          <Route path="/lab/pomodoro" element={<PomodoroPage />} />
          <Route path="/teste-vocacional" element={<VocationalTestPage />} />
        </Route>
      </Routes>
      
      <Toaster 
        position="top-center"
        closeButton
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#1f2937',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          },
          classNames: {
            toast: 'text-slate-800 rounded-xl p-4',
            title: 'font-bold text-slate-900',
            description: 'text-slate-600',
            icon: 'w-6 h-6',
            closeButton: 'bg-white/10 border-none text-slate-500 hover:text-slate-900',
          },
        }}
        icons={{
          success: <CheckCircle className="text-green-500" />,
          info: <Info className="text-blue-500" />,
          warning: <AlertTriangle className="text-yellow-500" />,
          error: <XCircle className="text-red-500" />,
          loading: <Loader2 className="animate-spin text-slate-500" />,
        }}
      />
    </Router>
  );
}

export default App;
