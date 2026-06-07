import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, CreditCard,
  FileText, Bell, Settings, LogOut, Search,
  ChevronLeft, ChevronRight, User, Menu, X
} from "lucide-react";
import { Input } from "./ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import api from "../services/api";

const navItems = [
  { path: "/dashboard",   label: "Tableau de bord", icon: LayoutDashboard },
  { path: "/biens",       label: "Mes Biens",        icon: Building2 },
  { path: "/locataires",  label: "Locataires",       icon: Users },
  { path: "/paiements",   label: "Paiements",        icon: CreditCard },
  { path: "/documents",   label: "Documents",        icon: FileText },
  { path: "/relances",    label: "Relances",         icon: Bell },
  { path: "/parametres",  label: "Paramètres",       icon: Settings },
];

const bottomNavItems = [
  { path: "/dashboard",  label: "Accueil",    icon: LayoutDashboard },
  { path: "/biens",      label: "Biens",      icon: Building2 },
  { path: "/locataires", label: "Locataires", icon: Users },
  { path: "/paiements",  label: "Paiements",  icon: CreditCard },
  { path: "/relances",   label: "Relances",   icon: Bell },
];

const mockNotifications = [
  { id: 1, title: "Paiement en retard", message: "Lamine THIAM - Loyer Janvier", time: "Il y a 2h", unread: true },
  { id: 2, title: "Nouveau document", message: "Contrat ajouté pour APT-691", time: "Il y a 5h", unread: true },
  { id: 3, title: "Relance envoyée", message: "Rappel envoyé à Babacar NGOM", time: "Hier", unread: false },
];

export default function Layout({ children, user }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.post("/api/auth/logout"); } catch {}
    localStorage.removeItem("propria_token");
    localStorage.removeItem("propria_user");
    navigate("/login");
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const results = [];
    const q = query.toLowerCase();
    if ("lamine".includes(q) || "thiam".includes(q)) results.push({ type: "tenant", name: "Lamine THIAM", path: "/locataires/ten_001" });
    if ("cheikh".includes(q)) results.push({ type: "tenant", name: "Cheikh Tidiane", path: "/locataires/ten_002" });
    if ("immeuble".includes(q) || "btp".includes(q)) results.push({ type: "building", name: "Immeuble BTP", path: "/biens/bld_002" });
    if ("paiement".includes(q)) results.push({ type: "page", name: "Paiements", path: "/paiements" });
    if ("document".includes(q)) results.push({ type: "page", name: "Documents", path: "/documents" });
    if ("relance".includes(q)) results.push({ type: "page", name: "Relances", path: "/relances" });
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  const markAllAsRead = () => setNotifications(n => n.map(x => ({ ...x, unread: false })));
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotificationClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    navigate(`/notifications/${notif.id}`, { state: { notification: notif } });
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)]">

      {/* ── Right drawer overlay (mobile) ─────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Right drawer (mobile) ──────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-72 z-50 flex flex-col lg:hidden transition-transform duration-300 shadow-2xl border-l ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="font-semibold text-[var(--text)]">Menu</p>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User profile */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center overflow-hidden">
              {user?.picture
                ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                : <User className="w-5 h-5 text-[var(--primary)]" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{user?.name || "Admin"}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="py-3 px-3 space-y-1 border-b" style={{ borderColor: 'var(--border)' }}>
          <NavLink to="/documents" className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span>Documents</span>
          </NavLink>
          <NavLink to="/parametres" className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""}`}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Paramètres</span>
          </NavLink>
        </div>

        {/* Notifications in drawer */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold text-[var(--text)]">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-[var(--primary)] hover:underline">
                Tout marquer lu
              </button>
            )}
          </div>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { handleNotificationClick(n); setMobileOpen(false); }}
              className={`px-4 py-3 border-b last:border-0 hover:bg-[var(--muted)] cursor-pointer transition-colors ${n.unread ? "bg-[var(--primary)]/10" : ""}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{n.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{n.message}</p>
                  <p className="text-xs text-[var(--muted-foreground)] opacity-70 mt-0.5">{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drawer logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-left hover:bg-red-500/10 hover:text-red-600"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* ── Sidebar (desktop only) ─────────────────────────── */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed left-0 top-0 h-full bg-[var(--sidebar)] z-50 transition-all duration-300 group ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Branding */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(78,122,108,0.15)' }}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(78,122,108,0.35)',
            }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <p style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>
                  Propria
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(78,122,108,0.7)', fontWeight: '500' }}>
                  Gestion Locative
                </p>
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
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(78,122,108,0.15)' }}>
          <button
            onClick={handleLogout}
            className={`sidebar-item w-full text-left hover:bg-red-500/10 hover:text-red-600 ${collapsed ? "justify-center px-3" : ""}`}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] items-center justify-center shadow-sm hover:bg-[var(--muted)] hover:text-[var(--primary)] transition-all duration-200 opacity-0 group-hover:opacity-100"
          data-testid="collapse-sidebar-btn"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      {/* Fix Tailwind purge: lg:ml-20 and lg:ml-64 must appear as full literals */}
      <div className={`flex-1 transition-all duration-300 ml-0 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>

        {/* Top bar */}
        <header
          className="h-16 border-b flex items-center px-4 lg:px-6 sticky top-0 z-40"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 1px 0 var(--border)' }}
          data-testid="header"
        >
          {/* Mobile: Propria logo (left) */}
          <div className="lg:hidden flex items-center gap-2 mr-auto">
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
              Propria
            </span>
          </div>

          {/* Desktop: search bar */}
          <div className="hidden lg:block relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              className="pl-10 bg-[var(--input)] border-[var(--border)] text-sm"
              data-testid="search-input"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
                {searchResults.map((result, i) => (
                  <button key={i}
                    onClick={() => { navigate(result.path); setSearchQuery(""); setShowSearchResults(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] flex items-center gap-3 border-b border-[var(--border)] last:border-0"
                  >
                    <span className="text-sm font-medium text-[var(--text)]">{result.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Bell — always visible */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors" data-testid="notifications-btn">
                  <Bell className="w-5 h-5 text-[var(--primary)]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 sm:w-80 p-0 bg-[var(--card)] border border-[var(--border)] shadow-xl rounded-xl" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text)]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-[var(--primary)] hover:underline">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] cursor-pointer transition-colors ${n.unread ? "bg-[var(--primary)]/10" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.unread ? "bg-[var(--primary)]" : "bg-[var(--border)]"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text)]">{n.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">{n.message}</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-1 opacity-70">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)] rounded-b-xl">
                  <button onClick={() => navigate("/relances")} className="text-xs text-[var(--primary)] hover:underline w-full text-center">
                    Voir toutes les alertes
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile dropdown — desktop only */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-[var(--muted)] rounded-lg p-2 transition-colors" data-testid="profile-dropdown">
                    <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center overflow-hidden">
                      {user?.picture
                        ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                        : <User className="w-4 h-4 text-[var(--primary)]" />
                      }
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-[var(--text)] leading-tight">{user?.name || "Admin"}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" /> Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/parametres")} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--primary)]"
              data-testid="mobile-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fade-in pb-24 lg:pb-6">
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <nav
          className="fixed bottom-0 left-0 right-0 lg:hidden z-40 border-t"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          data-testid="bottom-nav"
        >
          <div className="flex items-center justify-around py-2 px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all min-w-0"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
                >
                  <item.icon
                    className="w-5 h-5 flex-shrink-0"
                    style={{ strokeWidth: isActive ? 2.5 : 1.5 }}
                  />
                  <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
