import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Plus, Building2, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import api from "../services/api";

export default function BienDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: "", floor: "", rooms: "" });

  useEffect(() => {
    fetchBuildingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBuildingDetails = async () => {
    try {
      const [buildingRes, unitsRes] = await Promise.all([
        api.get(`/api/buildings/${id}`),
        api.get(`/api/units?building_id=${id}`)
      ]);
      setBuilding(buildingRes.data);
      setUnits(unitsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name) {
      toast.error("Veuillez remplir le nom");
      return;
    }
    try {
      await api.post("/api/units", {
        ...newUnit,
        building_id: id,
        floor: newUnit.floor ? parseInt(newUnit.floor) : null,
        rooms: newUnit.rooms ? parseInt(newUnit.rooms) : null
      });
      toast.success("Appartement ajouté");
      setNewUnit({ name: "", floor: "", rooms: "" });
      setShowAddUnit(false);
      fetchBuildingDetails();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!confirm("Supprimer cet appartement ?")) return;
    try {
      await api.delete(`/api/units/${unitId}`);
      toast.success("Appartement supprimé");
      fetchBuildingDetails();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">Immeuble non trouvé</p>
        <Button onClick={() => navigate("/biens")} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="bien-details-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/biens")}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">{building.name}</h1>
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <MapPin className="w-4 h-4" />
            {building.address}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="propria-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[var(--primary)]/10 rounded-xl">
              <Building2 className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{building.unit_count}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Appartements</p>
            </div>
          </div>
        </div>
        <div className="propria-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Home className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{building.unit_count - building.vacant_count}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Occupés</p>
            </div>
          </div>
        </div>
        <div className="propria-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Home className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text)]">{building.vacant_count}</p>
              <p className="text-sm text-[var(--muted-foreground)]">Vacants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Units List */}
      <div className="propria-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Tous les appartements</h2>
          <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--primary)] hover:bg-[#4a7063] text-white" data-testid="add-unit-detail-btn">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un appartement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nom / Numéro</Label>
                  <Input
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    placeholder="APT-101"
                    className="bg-[var(--input)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Étage</Label>
                    <Input
                      type="number"
                      value={newUnit.floor}
                      onChange={(e) => setNewUnit({ ...newUnit, floor: e.target.value })}
                      placeholder="1"
                      className="bg-[var(--input)]"
                    />
                  </div>
                  <div>
                    <Label>Pièces</Label>
                    <Input
                      type="number"
                      value={newUnit.rooms}
                      onChange={(e) => setNewUnit({ ...newUnit, rooms: e.target.value })}
                      placeholder="3"
                      className="bg-[var(--input)]"
                    />
                  </div>
                </div>
                <Button onClick={handleAddUnit} className="w-full bg-[var(--primary)]">
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
                <th>Appartement</th>
                <th>Étage</th>
                <th>Pièces</th>
                <th>Loyer</th>
                <th>Locataire</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-[var(--muted-foreground)] py-8">
                    Aucun appartement
                  </td>
                </tr>
              )}
              {units.map((unit) => (
              <tr key={unit.unit_id} data-testid={`unit-detail-row-${unit.unit_id}`}>
                    <td className="font-medium">{unit.name}</td>
                    <td>{unit.floor || "---"}</td>
                    <td>{unit.rooms || "---"}</td>
                    <td>
                      {unit.loyer_mensuel
                        ? new Intl.NumberFormat("fr-SN").format(unit.loyer_mensuel) + " FCFA"
                        : "---"}
                    </td>
                    <td>{unit.tenant_name || "---"}</td>
                    <td>
                      <span className={unit.status === "occupied" ? "badge-occupied" : "badge-vacant"}>
                        {unit.status === "occupied" ? "Occupé" : "Vacant"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {unit.status === "vacant" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/assigner/${unit.unit_id}`, {
                              state: {
                                unit_name: unit.name,
                                building_name: building.name
                              }
                            })}
                            data-testid={`assign-unit-detail-${unit.unit_id}`}
                          >
                            Assigner
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUnit(unit.unit_id)}
                          data-testid={`delete-unit-${unit.unit_id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
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
