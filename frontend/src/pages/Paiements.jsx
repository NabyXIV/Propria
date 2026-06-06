import { useState, useEffect } from "react";
import { CreditCard, Plus, Filter, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import api from "../services/api";

export default function Paiements() {
  const [payments, setPayments] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [newPayment, setNewPayment] = useState({
    lease_id: "",
    period: "",
    amount: "",
    status: "UNPAID",
    due_date: ""
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      const url = statusFilter ? `/api/payments?status=${statusFilter}` : "/api/payments";
      const [paymentsRes, leasesRes, chartRes] = await Promise.all([
        api.get(url),
        api.get("/api/leases"),
        api.get("/api/dashboard/chart-data"),
      ]);
      setPayments(paymentsRes.data);
      setLeases(leasesRes.data);
      setChartData(
        chartRes.data.map((item) => ({
          ...item,
          month: item.month.split("-")[1] + "/" + item.month.split("-")[0].slice(2),
        }))
      );
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.lease_id || !newPayment.period || !newPayment.amount || !newPayment.due_date) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    try {
      await api.post("/api/payments", {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        due_date: new Date(newPayment.due_date).toISOString(),
      });
      toast.success("Paiement ajouté");
      setNewPayment({ lease_id: "", period: "", amount: "", status: "UNPAID", due_date: "" });
      setShowAddPayment(false);
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      await api.put(`/api/payments/${paymentId}`, {
        status: newStatus,
        paid_at: newStatus === "PAID" ? new Date().toISOString() : null,
      });
      toast.success("Statut mis à jour");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-SN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="paiements-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Paiements</h1>
        <p className="text-[var(--muted-foreground)]">Gérez les paiements de loyer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Filters */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Status</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setStatusFilter(null)}
              className={`status-filter ${!statusFilter ? "active" : ""}`}
              data-testid="filter-all"
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`status-filter paid ${statusFilter === "PAID" ? "active" : ""}`}
              data-testid="filter-paid"
            >
              Payé
            </button>
            <button
              onClick={() => setStatusFilter("LATE")}
              className={`status-filter late ${statusFilter === "LATE" ? "active" : ""}`}
              data-testid="filter-late"
            >
              En retard
            </button>
            <button
              onClick={() => setStatusFilter("VERIFY")}
              className={`status-filter verify ${statusFilter === "VERIFY" ? "active" : ""}`}
              data-testid="filter-verify"
            >
              À vérifier
            </button>
            <button
              onClick={() => setStatusFilter("UNPAID")}
              className={`status-filter ${statusFilter === "UNPAID" ? "active" : ""}`}
              data-testid="filter-unpaid"
            >
              Non payé
            </button>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Note: Une fois l'échéance choisie passée, le statut passe en retard
          </p>
        </div>

        {/* Chart */}
        <div className="propria-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Évaluation des encaissements</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-[#5F8D7E]"></span>
                Encaissé
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border-2 border-[#A7D8C8]"></span>
                Attendu
              </span>
            </div>
          </div>
          {isMounted ? (
            <div style={{ width: '100%', height: '192px' }}>
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
                  <Line type="monotone" dataKey="paid" stroke="#5F8D7E" strokeWidth={2} dot={{ fill: "#5F8D7E" }} />
                  <Line type="monotone" dataKey="expected" stroke="#A7D8C8" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ width: '100%', height: '192px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                Chargement...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="propria-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Tableau Mensuel</h2>
          <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--primary)] hover:bg-[#4a7063] text-white" data-testid="add-payment-btn">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un paiement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Bail / Locataire</Label>
                  <Select value={newPayment.lease_id} onValueChange={(v) => setNewPayment({ ...newPayment, lease_id: v })}>
                    <SelectTrigger className="bg-[var(--input)]" data-testid="select-lease">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.filter(l => l.active).map((lease) => (
                        <SelectItem key={lease.lease_id} value={lease.lease_id}>
                          {lease.tenant_name} - {lease.unit_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Période (YYYY-MM)</Label>
                    <Input
                      value={newPayment.period}
                      onChange={(e) => setNewPayment({ ...newPayment, period: e.target.value })}
                      placeholder="2026-01"
                      className="bg-[var(--input)]"
                      data-testid="payment-period-input"
                    />
                  </div>
                  <div>
                    <Label>Montant</Label>
                    <Input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      placeholder="500"
                      className="bg-[var(--input)]"
                      data-testid="payment-amount-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date d'échéance</Label>
                    <Input
                      type="date"
                      value={newPayment.due_date}
                      onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                      className="bg-[var(--input)]"
                      data-testid="payment-due-date-input"
                    />
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={newPayment.status} onValueChange={(v) => setNewPayment({ ...newPayment, status: v })}>
                      <SelectTrigger className="bg-[var(--input)]" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNPAID">Non payé</SelectItem>
                        <SelectItem value="PAID">Payé</SelectItem>
                        <SelectItem value="LATE">En retard</SelectItem>
                        <SelectItem value="VERIFY">À vérifier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddPayment} className="w-full bg-[var(--primary)]" data-testid="submit-payment-btn">
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="propria-table">
            <thead>
              <tr>
                <th>Locataire</th>
                <th>Téléphone</th>
                <th>Bien</th>
                <th>Date début</th>
                <th>Loyer</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--muted-foreground)] py-8">
                    Aucun paiement
                  </td>
                </tr>
              )}
              {payments.map((payment) => (
              <tr key={payment.payment_id} data-testid={`payment-row-${payment.payment_id}`}>
                    <td className="font-medium">{payment.tenant_name || "N/A"}</td>
                    <td className="text-[var(--muted-foreground)]">{payment.tenant_phone || "---"}</td>
                    <td>{payment.building_name} - {payment.unit_name}</td>
                    <td>{new Date(payment.due_date).toLocaleDateString("fr-FR")}</td>
                    <td className="font-medium">{formatCurrency(payment.amount)}</td>
                    <td>
                      <Select 
                        value={payment.status} 
                        onValueChange={(v) => handleUpdateStatus(payment.payment_id, v)}
                      >
                        <SelectTrigger 
                          className="w-36 h-9 bg-[var(--card)] border-[var(--border)]" 
                          data-testid={`status-select-${payment.payment_id}`}
                        >
                          <SelectValue>{getStatusBadge(payment.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--card)]">
                          <SelectItem value="PAID" className="cursor-pointer">
                            <span className="badge-paid">Payé</span>
                          </SelectItem>
                          <SelectItem value="LATE" className="cursor-pointer">
                            <span className="badge-late">En retard</span>
                          </SelectItem>
                          <SelectItem value="VERIFY" className="cursor-pointer">
                            <span className="badge-verify">À vérifier</span>
                          </SelectItem>
                          <SelectItem value="UNPAID" className="cursor-pointer">
                            <span className="badge-unpaid">Non payé</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td>
                      <Button size="sm" variant="outline" data-testid={`view-payment-${payment.payment_id}`}>
                        Voir
                      </Button>
                    </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
