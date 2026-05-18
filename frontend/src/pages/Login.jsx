import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem("propria_token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const data = response.data;
      localStorage.setItem("propria_token", data.access_token);
      localStorage.setItem("propria_user", JSON.stringify(data.user));
      toast.success("Connexion réussie");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.detail || "Identifiants invalides";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleDemoLogin = () => {
    const fakeToken = "demo_token_local_only";
    const fakeUser = {
      user_id: "demo_001",
      name: "Admin Démo",
      email: "admin@propria.sn",
      picture: null
    };
    localStorage.setItem("propria_token", fakeToken);
    localStorage.setItem("propria_user", JSON.stringify(fakeUser));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(145deg, #A7D8C8 0%, #8FCAB8 40%, #7ABCAA 100%)' }}>

        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '240px', height: '240px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '-40px',
          width: '180px', height: '180px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%',
        }} />

        <div className="max-w-md text-center relative z-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
               style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)' }}>
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#1E2B28', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em' }}>
            Propria
          </h1>
          <p className="text-lg mb-10" style={{ color: 'rgba(30,43,40,0.7)' }}>
            Gestion locative professionnelle simplifiée
          </p>
          <div className="space-y-4 text-left">
            {[
              "Gérez vos biens immobiliers",
              "Suivez vos locataires et paiements",
              "Automatisez vos relances"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4"
                   style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px 16px', backdropFilter: 'blur(6px)' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(255,255,255,0.35)' }}>
                  <span className="text-sm font-bold" style={{ color: '#1E2B28' }}>{i + 1}</span>
                </div>
                <span style={{ color: '#1E2B28', fontWeight: '500', fontSize: '15px' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 login-right">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--primary)]">Propria</h1>
          </div>

          <div className="propria-card">
            <h2 className="text-2xl font-semibold text-[var(--text)] mb-2">Connexion</h2>
            <p className="text-[var(--muted-foreground)] mb-6">
              Accédez à votre espace de gestion locative
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[var(--input)]"
                    required
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[var(--input)]"
                    required
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--text)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--primary)] hover:bg-[#4a7063] text-white"
                disabled={isLoading}
                data-testid="login-btn"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--card)] text-[var(--muted-foreground)]">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-[var(--border)] hover:bg-[var(--muted)]"
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>

            {process.env.REACT_APP_SHOW_DEMO === "true" && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-[var(--card)] text-[var(--muted-foreground)]">
                      mode développement
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-2 px-4 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                >
                  Connexion démo (dev uniquement)
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
