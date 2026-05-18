import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Phone, Mail, Building2, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import api from "../services/api";

export default function Locataires() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ full_name: "", phone: "", email: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get("/api/tenants");
      setTenants(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des locataires");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    if (!newTenant.full_name) {
      toast.error("Le nom est obligatoire");
      return;
    }
    try {
      await api.post("/api/tenants", newTenant);
      toast.success("Locataire ajouté");
      setNewTenant({ full_name: "", phone: "", email: "" });
      setShowAddTenant(false);
      fetchTenants();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "---";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="locataires-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Locataires</h1>
        <p className="text-[var(--muted-foreground)]">Liste & fiches locataires</p>
      </div>

      {/* Tenants Card */}
      <div className="propria-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Tous les locataires</h2>
          <Dialog open={showAddTenant} onOpenChange={setShowAddTenant}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--primary)] hover:bg-[#4a7063] text-white" data-testid="add-tenant-btn">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un locataire</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nom complet *</Label>
                  <Input
                    value={newTenant.full_name}
                    onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="bg-[var(--input)]"
                    data-testid="tenant-name-input"
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    placeholder="+221 77 000 00 00"
                    className="bg-[var(--input)]"
                    data-testid="tenant-phone-input"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    placeholder="email@example.com"
                    className="bg-[var(--input)]"
                    data-testid="tenant-email-input"
                  />
                </div>
                <Button onClick={handleAddTenant} className="w-full bg-[var(--primary)]" data-testid="submit-tenant-btn">
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--muted-foreground)] py-8">
                    Aucun locataire
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.tenant_id} data-testid={`tenant-row-${tenant.tenant_id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <span className="font-medium">{tenant.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                        <Phone className="w-4 h-4" />
                        {tenant.phone || "---"}
                      </div>
                    </td>
                    <td>
                      {tenant.building_name && tenant.unit_name ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-[var(--primary)]" />
                          {tenant.building_name} - {tenant.unit_name}
                        </div>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">---</span>
                      )}
                    </td>
                    <td>
                      {tenant.lease_start 
                        ? new Date(tenant.lease_start).toLocaleDateString("fr-FR")
                        : "---"
                      }
                    </td>
                    <td className="font-medium">{formatCurrency(tenant.rent)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/locataires/${tenant.tenant_id}`)}
                        data-testid={`view-tenant-${tenant.tenant_id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </td>
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
