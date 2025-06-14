
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { QueryProvider } from './providers/QueryProvider';
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from './components/ProtectedRoute';
import SplashScreen from './pages/SplashScreen';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import ModulesPage from './pages/ModulesPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import PhaseDetailPage from './pages/PhaseDetailPage';
import SocialPage from './pages/SocialPage';
import LabPage from './pages/LabPage';
import { RewardModalProvider } from './components/XpRewardModal/RewardModalContext';

function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <RewardModalProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/inicio" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<SignupPage />} />
                <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
                <Route path="/lab" element={<ProtectedRoute><LabPage /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/modulos" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
                <Route path="/modulo/:id" element={<ProtectedRoute><ModuleDetailPage /></ProtectedRoute>} />
                <Route path="/modulo/:moduleId/fase/:id" element={<ProtectedRoute><PhaseDetailPage /></ProtectedRoute>} />
                {/* Redirect any unknown routes to home */}
                <Route path="*" element={<Navigate to="/inicio" replace />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </RewardModalProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
