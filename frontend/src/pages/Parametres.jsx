import { useState, useEffect } from "react";
import { User, Moon, Sun, Save, Mail, Phone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Parametres() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "" });

  useEffect(() => {
    // Load user data
    const savedUser = localStorage.getItem("propria_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setEditData({ name: userData.name || "", email: userData.email || "" });
    }

    // Load theme preference
    const savedTheme = localStorage.getItem("propria_theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("propria_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("propria_theme", "light");
    }
    
    toast.success(newMode ? "Mode sombre activé" : "Mode clair activé");
  };

  const handleSaveProfile = () => {
    // Update local storage
    const updatedUser = { ...user, name: editData.name, email: editData.email };
    localStorage.setItem("propria_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    toast.success("Profil mis à jour");
  };

  return (
    <div className="space-y-6" data-testid="parametres-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Paramètres</h1>
        <p className="text-[var(--muted-foreground)]">Gérez votre compte et vos préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Section */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Profil utilisateur</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[var(--primary)]" />
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-[var(--text)]">{user?.name || "Admin"}</p>
              <p className="text-[var(--muted-foreground)]">Gestionnaire</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="bg-[var(--input)]"
                data-testid="profile-name-input"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="bg-[var(--input)]"
                data-testid="profile-email-input"
              />
            </div>

            <Button 
              onClick={handleSaveProfile}
              className="bg-[var(--primary)] hover:bg-[#4a7063] text-white"
              data-testid="save-profile-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Apparence</h2>
          
          <div className="flex items-center justify-between p-4 bg-[var(--muted)] rounded-xl">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-6 h-6 text-[var(--primary)]" />
              ) : (
                <Sun className="w-6 h-6 text-[var(--primary)]" />
              )}
              <div>
                <p className="font-medium text-[var(--text)]">Mode sombre</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {darkMode ? "Activé" : "Désactivé"}
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
              data-testid="dark-mode-toggle"
            />
          </div>

          <div className="mt-6 p-4 border border-[var(--border)] rounded-xl">
            <h3 className="font-medium text-[var(--text)] mb-2">Aperçu</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-12 rounded-lg bg-[var(--background)] border border-[var(--border)]" title="Background"></div>
              <div className="h-12 rounded-lg bg-[var(--sidebar)]" title="Sidebar"></div>
              <div className="h-12 rounded-lg bg-[var(--primary)]" title="Primary"></div>
              <div className="h-12 rounded-lg bg-[var(--card)] border border-[var(--border)]" title="Card"></div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Informations du compte</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[var(--muted-foreground)]" />
                <span className="text-[var(--text)]">{user?.email || "admin@example.com"}</span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Vérifié</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[var(--muted-foreground)]" />
                <span className="text-[var(--text)]">ID: {user?.user_id || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">À propos de DORA</h2>
          
          <div className="space-y-3 text-[var(--muted-foreground)]">
            <p><strong className="text-[var(--text)]">Version:</strong> 1.0.0</p>
            <p><strong className="text-[var(--text)]">Description:</strong> Application de gestion locative professionnelle</p>
            <p><strong className="text-[var(--text)]">Technologies:</strong> React, FastAPI, MongoDB</p>
          </div>

          <div className="mt-6 p-4 bg-[var(--primary)]/5 rounded-xl border border-[var(--primary)]/20">
            <p className="text-sm text-[var(--text)]">
              <strong>DORA</strong> vous permet de gérer efficacement vos biens immobiliers, 
              locataires, paiements et documents en un seul endroit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
