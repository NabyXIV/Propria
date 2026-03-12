import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Users, 
  Plus,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("propria_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const fetchDashboardData = async () => {
    try {
      const headers = { ...getAuthHeaders() };
      
      const [statsRes, paymentsRes, chartRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/dashboard/recent-payments?limit=5`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/dashboard/chart-data`, { headers, credentials: "include" })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setRecentPayments(paymentsData);
      }
      
      if (chartRes.ok) {
        const chartDataRes = await chartRes.json();
        setChartData(chartDataRes.map(item => ({
          ...item,
          month: item.month.split("-")[1] + "/" + item.month.split("-")[0].slice(2)
        })));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PAID: "badge-paid",
      LATE: "badge-late",
      VERIFY: "badge-verify",
      UNPAID: "badge-unpaid"
    };
    const labels = {
      PAID: "Payé",
      LATE: "En retard",
      VERIFY: "À vérifier",
      UNPAID: "Non payé"
    };
    return <span className={badges[status] || badges.UNPAID}>{labels[status] || status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Bienvenue Admin</h1>
        <p className="text-[var(--muted-foreground)]">Résumé du mois en cours</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Expected Amount */}
        <div className="propria-card" data-testid="stat-expected">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Montants Attendus</p>
              <p className="text-3xl font-bold text-[var(--text)] mt-2">
                {formatCurrency(stats?.expected_amount || 0)}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                +10% vs mois dernier
              </p>
            </div>
            <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
              <DollarSign className="w-6 h-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="propria-card" data-testid="stat-paid">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Payés</p>
              <p className="text-3xl font-bold text-[var(--text)] mt-2">
                {formatCurrency(stats?.paid_amount || 0)}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {stats?.paid_units || 0} appartements
              </p>
            </div>
            <Button 
              size="sm" 
              className="bg-green-500 hover:bg-green-600 text-white"
              data-testid="paid-ok-btn"
            >
              OK
            </Button>
          </div>
        </div>

        {/* Late Amount */}
        <div className="propria-card" data-testid="stat-late">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-500 uppercase tracking-wide">En Retard</p>
              <p className="text-3xl font-bold text-red-500 mt-2">
                {formatCurrency(stats?.late_amount || 0)}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {stats?.late_units || 0} appartements
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => navigate("/relances")}
              data-testid="view-late-btn"
            >
              VOIR
            </Button>
          </div>
        </div>
      </div>

      {/* Chart and Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 propria-card" data-testid="chart-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Évaluation des encaissements</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Jan - Déc</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: "var(--card)", 
                    border: "1px solid var(--border)",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  stroke="#5F8D7E" 
                  strokeWidth={2}
                  name="Encaissé"
                  dot={{ fill: "#5F8D7E" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="#A7D8C8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Attendu"
                  dot={{ fill: "#A7D8C8" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="propria-card" data-testid="shortcuts-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Raccourcis</h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-[var(--border)] hover:bg-[var(--muted)]"
              onClick={() => navigate("/biens")}
              data-testid="shortcut-add-property"
            >
              <Plus className="w-4 h-4 mr-2 text-[var(--primary)]" />
              Ajouter un bien immo
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-[var(--border)] hover:bg-[var(--muted)]"
              onClick={() => navigate("/locataires")}
              data-testid="shortcut-add-tenant"
            >
              <Plus className="w-4 h-4 mr-2 text-[var(--primary)]" />
              Ajouter un locataire
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start border-[var(--border)] hover:bg-[var(--muted)]"
              onClick={() => navigate("/relances")}
              data-testid="shortcut-view-reminders"
            >
              <AlertTriangle className="w-4 h-4 mr-2 text-[var(--warning)]" />
              Voir les relances
            </Button>
            <Button
              className="w-full bg-[var(--primary)] hover:bg-[#4a7063] text-white"
              onClick={() => navigate("/paiements")}
              data-testid="shortcut-add-payment"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Saisir un paiement
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="propria-card" data-testid="recent-payments-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Derniers Paiements</h2>
          <Button
            variant="ghost"
            className="text-[var(--primary)] hover:bg-[var(--primary)]/10"
            onClick={() => navigate("/paiements")}
            data-testid="view-all-payments"
          >
            Tout voir <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="propria-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Locataire</th>
                <th>Bien</th>
                <th>Montant</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-[var(--muted-foreground)] py-8">
                    Aucun paiement récent
                  </td>
                </tr>
              ) : (
                recentPayments.map((payment) => (
                  <tr key={payment.payment_id} data-testid={`payment-row-${payment.payment_id}`}>
                    <td>{new Date(payment.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</td>
                    <td>
                      <div>
                        <p className="font-medium">{payment.tenant_name || "N/A"}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{payment.tenant_phone}</p>
                      </div>
                    </td>
                    <td>{payment.building_name}, {payment.unit_name}</td>
                    <td className="font-medium">{formatCurrency(payment.amount)}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
