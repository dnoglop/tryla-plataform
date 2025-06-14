import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from './QueryProvider';
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import PhaseDetailPage from './pages/PhaseDetailPage';
import { XpRewardModalProvider } from './components/XpRewardModal/RewardModalContext';
import ModuleTrailPage from './pages/ModuleTrailPage';

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <XpRewardModalProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/modulos" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
                <Route path="/modulo/:id" element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>} />
                <Route path="/modulo/:id/trilha" element={<ProtectedRoute><ModuleTrailPage /></ProtectedRoute>} />
                <Route path="/modulo/:moduleId/fase/:id" element={<ProtectedRoute><PhaseDetailPage /></ProtectedRoute>} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </XpRewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
