
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
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
              <Navigate to="/perfil" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/login"
          element={session ? <Navigate to="/perfil" replace /> : <LoginPage />}
        />
        <Route
          path="/cadastro"
          element={session ? <Navigate to="/perfil" replace /> : <SignupPage />}
        />
        <Route
          path="/perfil"
          element={session ? <ProfilePage /> : <Navigate to="/login" />}
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
