import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User, UserPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import api from "../services/api";
import { createLease } from "../services/leases";

function BailFormSection({ bailForm, setBailForm }) {
  return (
    <div className="space-y-4 mt-6 pt-6 border-t border-[var(--border)]">
      <h3 className="font-semibold text-[var(--text)]">Conditions du bail</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label>Date de début</Label>
          <input
            type="date"
            value={bailForm.start_date}
            onChange={(e) => setBailForm({ ...bailForm, start_date: e.target.value })}
            className="propria-input"
          />
        </div>
        <div>
          <Label>Loyer mensuel (FCFA)</Label>
          <input
            type="number"
            value={bailForm.loyer_mensuel}
            onChange={(e) => setBailForm({ ...bailForm, loyer_mensuel: e.target.value })}
            placeholder="150000"
            min="0"
            step="1"
            className="propria-input"
          />
        </div>
        <div>
          <Label>Jour d'échéance</Label>
          <input
            type="number"
            value={bailForm.due_day}
            onChange={(e) => setBailForm({ ...bailForm, due_day: e.target.value })}
            min="1"
            max="31"
            className="propria-input"
          />
        </div>
      </div>
    </div>
  );
}

export default function AssignerLogement() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [activeTab, setActiveTab] = useState("existing");
  const [unitInfo, setUnitInfo] = useState(
    state ? { unit_name: state.unit_name, building_name: state.building_name } : null
  );

  const [tenants, setTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);

  const [newTenant, setNewTenant] = useState({ full_name: "", phone: "", email: "" });

  const today = new Date().toISOString().split("T")[0];
  const [bailForm, setBailForm] = useState({ start_date: today, loyer_mensuel: "", due_day: 5 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenants();
    if (!state) fetchUnitInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get("/api/tenants");
      setTenants(res.data);
    } catch {
      toast.error("Erreur lors du chargement des locataires");
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchUnitInfo = async () => {
    try {
      const res = await api.get(`/api/units/${unitId}`);
      setUnitInfo({ unit_name: res.data.name, building_name: res.data.building_name || "" });
    } catch { /* non-critical */ }
  };

  const buildLeasePayload = (tenantId) => ({
    tenant_id: tenantId,
    unit_id: unitId,
    start_date: `${bailForm.start_date}T00:00:00Z`,
    loyer_mensuel: parseInt(bailForm.loyer_mensuel, 10),
    due_day: parseInt(bailForm.due_day, 10),
  });

  const handleAssignExisting = async () => {
    if (!selectedTenant) return toast.error("Veuillez sélectionner un locataire");
    if (!bailForm.loyer_mensuel) return toast.error("Veuillez saisir le loyer mensuel");
    setSubmitting(true);
    try {
      await createLease(buildLeasePayload(selectedTenant.tenant_id));
      toast.success("Locataire assigné avec succès");
      navigate(-1);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de l'assignation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndAssign = async () => {
    if (!newTenant.full_name) return toast.error("Le nom complet est obligatoire");
    if (!bailForm.loyer_mensuel) return toast.error("Veuillez saisir le loyer mensuel");
    setSubmitting(true);
    try {
      const tenantRes = await api.post("/api/tenants", newTenant);
      await createLease(buildLeasePayload(tenantRes.data.tenant_id));
      toast.success("Locataire créé et assigné avec succès");
      navigate(-1);
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Erreur lors de l'opération"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter((t) =>
    t.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto" data-testid="assigner-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Assigner un locataire</h1>
          {unitInfo && (
            <p className="text-[var(--muted-foreground)]">
              {unitInfo.unit_name}
              {unitInfo.building_name ? ` · ${unitInfo.building_name}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="propria-card">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("existing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "existing"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--text)]"
            }`}
          >
            <User className="w-4 h-4" />
            Locataire existant
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "new"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--text)]"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Nouveau locataire
          </button>
        </div>

        {/* Onglet 1 — locataire existant */}
        {activeTab === "existing" && (
          <div>
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="propria-input mb-4"
            />

            {loadingTenants ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredTenants.length === 0 && (
                  <p className="text-center text-[var(--muted-foreground)] py-4">
                    Aucun locataire trouvé
                  </p>
                )}
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.tenant_id}
                    onClick={() => setSelectedTenant(tenant)}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedTenant?.tenant_id === tenant.tenant_id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5"
                        : "border-[var(--border)] hover:border-[var(--primary)]/40"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--text)]">{tenant.full_name}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {tenant.phone || "---"}
                      </p>
                    </div>
                    {tenant.current_unit && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        Déjà assigné
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <BailFormSection bailForm={bailForm} setBailForm={setBailForm} />

            <button
              onClick={handleAssignExisting}
              disabled={submitting}
              className="propria-btn-primary w-full mt-6"
            >
              {submitting ? "Assignation..." : "Assigner"}
            </button>
          </div>
        )}

        {/* Onglet 2 — nouveau locataire */}
        {activeTab === "new" && (
          <div className="space-y-4">
            <div>
              <Label>
                Nom complet <span className="text-red-500">*</span>
              </Label>
              <input
                type="text"
                value={newTenant.full_name}
                onChange={(e) => setNewTenant({ ...newTenant, full_name: e.target.value })}
                placeholder="Mamadou Diop"
                className="propria-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Téléphone</Label>
                <input
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                  className="propria-input"
                />
              </div>
              <div>
                <Label>Email</Label>
                <input
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  placeholder="mamadou@email.com"
                  className="propria-input"
                />
              </div>
            </div>

            <BailFormSection bailForm={bailForm} setBailForm={setBailForm} />

            <button
              onClick={handleCreateAndAssign}
              disabled={submitting}
              className="propria-btn-primary w-full mt-2"
            >
              {submitting ? "Création..." : "Créer et assigner"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
