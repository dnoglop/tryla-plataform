import { Routes, Route, Navigate } from "react-router-dom";
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
import SignupPage from "@/pages/SignupPage";
import { QueryProvider } from "@/providers/QueryProvider";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

import "./App.css";

// Componente de proteção de rotas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session);
      setLoading(false);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthenticated(!!session);
        setLoading(false);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-trilha-orange border-t-transparent rounded-full"></div>
    </div>;
  }
  
  return authenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Componente para redirecionar quando já autenticado
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthenticated(!!data.session);
      setLoading(false);
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthenticated(!!session);
        setLoading(false);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-trilha-orange border-t-transparent rounded-full"></div>
    </div>;
  }
  
  return authenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <>{children}</>
  );
};

function App() {
  return (
    <QueryProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/cadastro" element={<AuthRoute><SignupPage /></AuthRoute>} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/modulos" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
        <Route path="/modulo/:id" element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>} />
        <Route path="/fase/:moduleId/:phaseId" element={<ProtectedRoute><PhaseDetailPage /></ProtectedRoute>} />
        <Route path="/recompensas" element={<ProtectedRoute><RewardsPage /></ProtectedRoute>} />
        <Route path="/comunidade" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <SonnerToaster />
    </QueryProvider>
  );
}

export default App;
