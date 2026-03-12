import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Extract session_id from URL fragment
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (!sessionIdMatch) {
        toast.error("Session invalide");
        navigate("/login");
        return;
      }

      const sessionId = sessionIdMatch[1];

      try {
        // Exchange session_id for session data via backend
        const response = await fetch(`${API_URL}/api/auth/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error("Échec de l'authentification");
        }

        const userData = await response.json();
        
        // Store user data
        localStorage.setItem("propria_user", JSON.stringify(userData));
        
        toast.success("Connexion réussie");
        
        // Navigate to dashboard with user data
        navigate("/dashboard", { state: { user: userData }, replace: true });
      } catch (error) {
        console.error("Auth callback error:", error);
        toast.error("Erreur d'authentification");
        navigate("/login");
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--text)] font-medium">Connexion en cours...</p>
      </div>
    </div>
  );
}
