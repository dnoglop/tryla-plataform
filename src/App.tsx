import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importe seus novos componentes de estrutura
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "@/components/Layout";

// Importe suas páginas
import SplashScreen from "./pages/SplashScreen";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import PhaseDetailPage from "./pages/PhaseDetailPage";
import RewardsPage from "./pages/RewardsPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import JournalPage from "./pages/JournalPage";
import TutorPage from "./pages/TutorPage";

import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- Rotas Públicas --- */}
        {/* Estas rotas não exigem login e não têm o layout com rodapé */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />

        {/* --- Rotas Protegidas --- */}
        {/* O componente ProtectedRoute vai cuidar da lógica de autenticação para TODAS as rotas aninhadas abaixo dele. */}
        <Route element={<ProtectedRoute />}>

          {/* Grupo de rotas que USAM o layout com rodapé */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/modulos" element={<ModulesPage />} />
            <Route path="/recompensas" element={<RewardsPage />} />
            <Route path="/comunidade" element={<CommunityPage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/diario" element={<JournalPage />} />
          </Route>

          {/* Grupo de rotas que NÃO USAM o layout (ex: tela cheia) */}
          {/* Elas ainda são protegidas, mas não mostram o BottomNavigation */}
          <Route path="/editar-perfil" element={<EditProfilePage />} />
          <Route path="/modulo/:id" element={<ModuleDetailPage />} />
          <Route path="/fase/:moduleId/:phaseId" element={<PhaseDetailPage />} />

        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;