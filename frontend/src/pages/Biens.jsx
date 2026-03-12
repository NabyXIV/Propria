import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, MapPin, Home, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Biens() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newBuilding, setNewBuilding] = useState({ name: "", address: "" });
  const [newUnit, setNewUnit] = useState({ name: "", floor: "", rooms: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      fetchUnits(selectedBuilding.building_id);
    }
  }, [selectedBuilding]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("propria_token");
    return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  const fetchBuildings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/buildings`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
        if (data.length > 0 && !selectedBuilding) {
          setSelectedBuilding(data[0]);
        }
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des immeubles");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async (buildingId) => {
    try {
      const response = await fetch(`${API_URL}/api/units?building_id=${buildingId}`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des appartements");
    }
  };

  const handleAddBuilding = async () => {
    if (!newBuilding.name || !newBuilding.address) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/buildings`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(newBuilding)
      });

      if (response.ok) {
        toast.success("Immeuble ajouté");
        setNewBuilding({ name: "", address: "" });
        setShowAddBuilding(false);
        fetchBuildings();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name || !selectedBuilding) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/units`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          ...newUnit,
          building_id: selectedBuilding.building_id,
          floor: newUnit.floor ? parseInt(newUnit.floor) : null,
          rooms: newUnit.rooms ? parseInt(newUnit.rooms) : null
        })
      });

      if (response.ok) {
        toast.success("Appartement ajouté");
        setNewUnit({ name: "", floor: "", rooms: "" });
        setShowAddUnit(false);
        fetchUnits(selectedBuilding.building_id);
        fetchBuildings();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const getOccupancyData = () => {
    if (!selectedBuilding) return [];
    const occupied = selectedBuilding.unit_count - selectedBuilding.vacant_count;
    return [
      { name: "Occupé", value: occupied, color: "#5F8D7E" },
      { name: "Vacant", value: selectedBuilding.vacant_count, color: "#E5E7EB" }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="biens-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Mes biens</h1>
        <p className="text-[var(--muted-foreground)]">immeubles & appartements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buildings List */}
        <div className="lg:col-span-2 propria-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Immeubles</h2>
            <Dialog open={showAddBuilding} onOpenChange={setShowAddBuilding}>
              <DialogTrigger asChild>
                <Button className="bg-[var(--primary)] hover:bg-[#4a7063] text-white" data-testid="add-building-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un immeuble</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Nom de l'immeuble</Label>
                    <Input
                      value={newBuilding.name}
                      onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                      placeholder="Immeuble A"
                      className="bg-[var(--input)]"
                      data-testid="building-name-input"
                    />
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Input
                      value={newBuilding.address}
                      onChange={(e) => setNewBuilding({ ...newBuilding, address: e.target.value })}
                      placeholder="Rue 13, Dakar"
                      className="bg-[var(--input)]"
                      data-testid="building-address-input"
                    />
                  </div>
                  <Button onClick={handleAddBuilding} className="w-full bg-[var(--primary)]" data-testid="submit-building-btn">
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
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Appartements</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {buildings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-[var(--muted-foreground)] py-8">
                      Aucun immeuble
                    </td>
                  </tr>
                ) : (
                  buildings.map((building) => (
                    <tr 
                      key={building.building_id} 
                      className={`cursor-pointer ${selectedBuilding?.building_id === building.building_id ? "bg-[var(--primary)]/5" : ""}`}
                      onClick={() => setSelectedBuilding(building)}
                      data-testid={`building-row-${building.building_id}`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-[var(--primary)]" />
                          <div>
                            <p className="font-medium">{building.name}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-[var(--muted-foreground)]">
                          <MapPin className="w-4 h-4" />
                          {building.address}
                        </div>
                      </td>
                      <td>{building.unit_count}</td>
                      <td><span className="badge-active">Actif</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Building Details */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Détails Immeubles</h2>
          
          {selectedBuilding ? (
            <>
              <div className="p-4 bg-[var(--muted)] rounded-xl mb-4">
                <p className="font-semibold text-[var(--text)]">{selectedBuilding.name}</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {selectedBuilding.unit_count} appartements - {selectedBuilding.vacant_count} vacants
                </p>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getOccupancyData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getOccupancyData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="text-[var(--muted-foreground)] text-center py-8">
              Sélectionnez un immeuble
            </p>
          )}
        </div>
      </div>

      {/* Units List */}
      {selectedBuilding && (
        <div className="propria-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">
              Appartements ({selectedBuilding.name})
            </h2>
            <div className="flex items-center gap-2">
              <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
                <DialogTrigger asChild>
                  <Button className="bg-[var(--primary)] hover:bg-[#4a7063] text-white" data-testid="add-unit-btn">
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
                        data-testid="unit-name-input"
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
                    <Button onClick={handleAddUnit} className="w-full bg-[var(--primary)]" data-testid="submit-unit-btn">
                      Ajouter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => navigate(`/biens/${selectedBuilding.building_id}`)}
                data-testid="view-all-units-btn"
              >
                Tout voir <span className="ml-1">→</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="propria-table">
              <thead>
                <tr>
                  <th>Appartement</th>
                  <th>Loyer</th>
                  <th>Locataire</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--muted-foreground)] py-8">
                      Aucun appartement
                    </td>
                  </tr>
                ) : (
                  units.slice(0, 5).map((unit) => (
                    <tr key={unit.unit_id} data-testid={`unit-row-${unit.unit_id}`}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-[var(--primary)]" />
                          {unit.name}
                        </div>
                      </td>
                      <td>{unit.rent ? `${unit.rent} $` : "---"}</td>
                      <td>{unit.tenant_name || "---"}</td>
                      <td>
                        <span className={unit.status === "occupied" ? "badge-occupied" : "badge-vacant"}>
                          {unit.status === "occupied" ? "Occupé" : "Vacant"}
                        </span>
                      </td>
                      <td>
                        {unit.status === "vacant" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/locataires")}
                            data-testid={`assign-unit-${unit.unit_id}`}
                          >
                            Assigner
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/locataires/${unit.tenant_id || ""}`)}
                            data-testid={`view-unit-${unit.unit_id}`}
                          >
                            Voir
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
