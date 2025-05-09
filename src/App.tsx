import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import ModulePage from "./pages/ModulePage";
import PhasePage from "./pages/PhasePage";
import JournalPage from "./pages/journal/JournalPage";
import NewEntryPage from "./pages/journal/NewEntryPage";
import EditEntryPage from "./pages/journal/EditEntryPage";
import EditProfilePage from "./pages/EditProfilePage";

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
          element={
            session ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/home" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={session ? <Navigate to="/home" replace /> : <RegisterPage />}
        />
        <Route
          path="/home"
          element={session ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/perfil"
          element={session ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/modulo/:moduleId"
          element={session ? <ModulePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/fase/:phaseId"
          element={session ? <PhasePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/diario"
          element={session ? <JournalPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/diario/new"
          element={session ? <NewEntryPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/diario/edit/:entryId"
          element={session ? <EditEntryPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/editar-perfil"
          element={session ? <EditProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
