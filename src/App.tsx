
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import SplashScreen from "./pages/SplashScreen";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import RewardsPage from "./pages/RewardsPage";
import CommunityPage from "./pages/CommunityPage";
import DashboardPage from "./pages/DashboardPage"; 
import ModulesPage from "./pages/ModulesPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import JournalPage from "./pages/JournalPage";
import PhaseDetailPage from "./pages/PhaseDetailPage";
import TutorPage from "./pages/TutorPage";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<SplashScreen />}
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/cadastro"
          element={session ? <Navigate to="/dashboard" /> : <SignupPage />}
        />
        <Route
          path="/dashboard"
          element={session ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/perfil"
          element={session ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/editar-perfil"
          element={session ? <EditProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/recompensas"
          element={session ? <RewardsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/comunidade"
          element={session ? <CommunityPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/modulos"
          element={session ? <ModulesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/modulo/:id"
          element={session ? <ModuleDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/fase/:moduleId/:phaseId"
          element={session ? <PhaseDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/diario"
          element={session ? <JournalPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/tutor"
          element={session ? <TutorPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
