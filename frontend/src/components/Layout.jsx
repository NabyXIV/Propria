import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  FileText, 
  Bell, 
  Settings, 
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  X
} from "lucide-react";
import { Input } from "./ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const navItems = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/biens", label: "Mes Biens", icon: Building2 },
  { path: "/locataires", label: "Locataires", icon: Users },
  { path: "/paiements", label: "Paiements", icon: CreditCard },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/relances", label: "Relances", icon: Bell },
  { path: "/parametres", label: "Paramètres", icon: Settings },
];

// Mock notifications for demo
const mockNotifications = [
  { id: 1, title: "Paiement en retard", message: "Lamine THIAM - Loyer Janvier", time: "Il y a 2h", unread: true },
  { id: 2, title: "Nouveau document", message: "Contrat ajouté pour APT-691", time: "Il y a 5h", unread: true },
  { id: 3, title: "Relance envoyée", message: "Rappel envoyé à Babacar NGOM", time: "Hier", unread: false },
];

export default function Layout({ children, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("propria_token");
    localStorage.removeItem("propria_user");
    navigate("/login");
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Search in local data - in a real app, this would be an API call
    const results = [];
    
    // Mock search results based on query
    const lowerQuery = query.toLowerCase();
    
    if ("lamine".includes(lowerQuery) || "thiam".includes(lowerQuery)) {
      results.push({ type: "tenant", name: "Lamine THIAM", path: "/locataires/ten_001" });
    }
    if ("cheikh".includes(lowerQuery) || "tidiane".includes(lowerQuery)) {
      results.push({ type: "tenant", name: "Cheikh Tidiane", path: "/locataires/ten_002" });
    }
    if ("immeuble".includes(lowerQuery) || "btp".includes(lowerQuery)) {
      results.push({ type: "building", name: "Immeuble BTP", path: "/biens/bld_002" });
    }
    if ("immeuble a".includes(lowerQuery)) {
      results.push({ type: "building", name: "Immeuble A", path: "/biens/bld_001" });
    }
    if ("apt".includes(lowerQuery) || "7515".includes(lowerQuery)) {
      results.push({ type: "unit", name: "APT-7515", path: "/biens/bld_001" });
    }
    if ("paiement".includes(lowerQuery) || "loyer".includes(lowerQuery)) {
      results.push({ type: "page", name: "Paiements", path: "/paiements" });
    }
    if ("document".includes(lowerQuery)) {
      results.push({ type: "page", name: "Documents", path: "/documents" });
    }
    if ("relance".includes(lowerQuery)) {
      results.push({ type: "page", name: "Relances", path: "/relances" });
    }

    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  const handleSearchSelect = (result) => {
    navigate(result.path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-[var(--sidebar)] transition-all duration-300 z-50 flex flex-col ${
          collapsed ? "w-20" : "w-64"
        }`}
        data-testid="sidebar"
      >
        {/* Project Branding */}
        <div className="p-4 border-b border-[var(--primary)]/20">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center flex-shrink-0 shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-2xl font-bold text-[var(--primary)] tracking-tight">DORA</p>
                <p className="text-xs text-[var(--primary)]/70">Gestion Locative</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""} ${collapsed ? "justify-center px-3" : ""}`
              }
              data-testid={`nav-${item.path.slice(1)}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-[var(--primary)]/20">
          <button
            onClick={handleLogout}
            className={`sidebar-item w-full text-left hover:bg-red-500/10 hover:text-red-600 ${
              collapsed ? "justify-center px-3" : ""
            }`}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse Toggle - More discrete */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] flex items-center justify-center shadow-sm hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-colors"
          data-testid="collapse-sidebar-btn"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        {/* Top Bar */}
        <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Search Bar with Results */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Rechercher locataires, biens..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="pl-10 bg-[var(--input)] border-[var(--border)]"
              data-testid="search-input"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] flex items-center gap-3 border-b border-[var(--border)] last:border-0"
                  >
                    {result.type === "tenant" && <Users className="w-4 h-4 text-[var(--primary)]" />}
                    {result.type === "building" && <Building2 className="w-4 h-4 text-[var(--primary)]" />}
                    {result.type === "unit" && <Building2 className="w-4 h-4 text-[var(--muted-foreground)]" />}
                    {result.type === "page" && <FileText className="w-4 h-4 text-[var(--muted-foreground)]" />}
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{result.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] capitalize">{result.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button 
                  className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors" 
                  data-testid="notifications-btn"
                >
                  <Bell className="w-5 h-5 text-[var(--primary)]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text)]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                      Aucune notification
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] cursor-pointer ${
                          notif.unread ? "bg-[var(--primary)]/5" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notif.unread ? "bg-[var(--primary)]" : "bg-transparent"}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--text)]">{notif.title}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{notif.message}</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-[var(--border)]">
                  <button 
                    onClick={() => navigate("/relances")}
                    className="text-xs text-[var(--primary)] hover:underline w-full text-center"
                  >
                    Voir toutes les alertes
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-[var(--muted)] rounded-lg p-2 pr-3 transition-colors" data-testid="profile-dropdown">
                  <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center overflow-hidden">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-[var(--primary)]" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-[var(--text)]">{user?.name || "Admin"}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{user?.email || "admin@example.com"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
