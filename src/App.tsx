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
      <Toaster 
        position="top-center" // Posição no topo, como solicitado
        richColors // Estilos pré-definidos para success, error, info
        toastOptions={{
          duration: 3000, // Duração padrão de 3 segundos
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
          },
          // Estilos específicos para cada tipo
          classNames: {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
          },
        }}
      />
    </Router>
  );
}

export default App;