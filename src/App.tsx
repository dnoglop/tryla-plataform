
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import Index from "@/pages/Index";
import DashboardPage from "@/pages/DashboardPage";
import ModulesPage from "@/pages/ModulesPage";
import ModuleDetailPage from "@/pages/ModuleDetailPage";
import PhaseDetailPage from "@/pages/PhaseDetailPage";
import RewardsPage from "@/pages/RewardsPage";
import CommunityPage from "@/pages/CommunityPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import { QueryProvider } from "@/providers/QueryProvider";

import "./App.css";

function App() {
  return (
    <QueryProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/modulos" element={<ModulesPage />} />
          <Route path="/modulo/:id" element={<ModuleDetailPage />} />
          <Route path="/fase/:moduleId/:phaseId" element={<PhaseDetailPage />} />
          <Route path="/recompensas" element={<RewardsPage />} />
          <Route path="/comunidade" element={<CommunityPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <SonnerToaster />
      </Router>
    </QueryProvider>
  );
}

export default App;
