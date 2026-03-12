import { useEffect, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Biens from "./pages/Biens";
import BienDetails from "./pages/BienDetails";
import Locataires from "./pages/Locataires";
import LocataireDetails from "./pages/LocataireDetails";
import Paiements from "./pages/Paiements";
import Documents from "./pages/Documents";
import Relances from "./pages/Relances";
import Parametres from "./pages/Parametres";
import AuthCallback from "./pages/AuthCallback";
import Layout from "./components/Layout";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If user data passed from AuthCallback, use it
    if (location.state?.user) {
      setIsAuthenticated(true);
      setUser(location.state.user);
      return;
    }

    // Check JWT token in localStorage
    const token = localStorage.getItem("propria_token");
    const savedUser = localStorage.getItem("propria_user");
    
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
      return;
    }

    // Check session via API (for Google OAuth)
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        if (response.ok) {
          const userData = await response.json();
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          navigate("/login");
        }
      } catch (error) {
        setIsAuthenticated(false);
        navigate("/login");
      }
    };
    checkAuth();
  }, [location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout user={user}>{children}</Layout>;
};

// App Router - handles session_id detection
function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (Emergent OAuth callback)
  // This MUST be synchronous to prevent race conditions
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/biens" element={<ProtectedRoute><Biens /></ProtectedRoute>} />
      <Route path="/biens/:id" element={<ProtectedRoute><BienDetails /></ProtectedRoute>} />
      <Route path="/locataires" element={<ProtectedRoute><Locataires /></ProtectedRoute>} />
      <Route path="/locataires/:id" element={<ProtectedRoute><LocataireDetails /></ProtectedRoute>} />
      <Route path="/paiements" element={<ProtectedRoute><Paiements /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/relances" element={<ProtectedRoute><Relances /></ProtectedRoute>} />
      <Route path="/parametres" element={<ProtectedRoute><Parametres /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("propria_theme");
    if (savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
