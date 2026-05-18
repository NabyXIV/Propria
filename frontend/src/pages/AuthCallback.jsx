import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../services/api";

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
        const response = await api.post("/api/auth/session", {
          session_id: sessionId
        });
        const userData = response.data;
        localStorage.setItem("propria_user", JSON.stringify(userData));
        toast.success("Connexion réussie");
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
