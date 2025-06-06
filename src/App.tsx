import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Componentes e Layout
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

// Páginas
import SplashScreen from "./pages/SplashScreen";
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />

        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          {/* Rotas com o Layout (rodapé) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modulos" element={<ModulesPage />} />
            <Route path="/social" element={<SocialPage />} /> {/* <<< 2. ROTA UNIFICADA */}
            <Route path="/lab" element={<LabPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            
            {/* Rotas que pertencem a uma aba, mas não devem ser acessadas diretamente no rodapé */}
            <Route path="/diario" element={<JournalPage />} />
            <Route path="/tutor" element={<TutorPage />} />
          </Route>

          {/* Rotas sem o Layout (tela cheia) */}
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/modulo/:id" element={<ModuleDetailPage />} />
          <Route path="/fase/:moduleId/:phaseId" element={<PhaseDetailPage />} />
          <Route path="/lab/pomodoro" element={<PomodoroPage />} />
          <Route path="/teste-vocacional" element={<VocationalTestPage />} />
        </Route>
      </Routes>
      <Toaster /* ...suas props do toaster... */ />
    </Router>
  );
}

export default App;