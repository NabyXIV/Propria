import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Mail, Calendar, DollarSign, FileText, Upload, Eye, Download, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import api from "../services/api";

export default function LocataireDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [lease, setLease] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", phone: "", email: "" });
  const [documentFile, setDocumentFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("pdf");
  const [contractFile, setContractFile] = useState(null);

  useEffect(() => {
    fetchTenantDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTenantDetails = async () => {
    try {
      const [tenantRes, leasesRes, docsRes] = await Promise.all([
        api.get(`/api/tenants/${id}`),
        api.get(`/api/leases?tenant_id=${id}`),
        api.get(`/api/documents?tenant_id=${id}`)
      ]);

      const tenantData = tenantRes.data;
      setTenant(tenantData);
      setEditData({
        full_name: tenantData.full_name,
        phone: tenantData.phone || "",
        email: tenantData.email || ""
      });

      const leasesData = leasesRes.data;
      const activeLease = leasesData.find(l => l.active);
      setLease(activeLease || null);

      if (activeLease) {
        const paymentsRes = await api.get(`/api/payments?lease_id=${activeLease.lease_id}`);
        setPayments(paymentsRes.data);
      }

      setDocuments(docsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTenant = async () => {
    try {
      await api.put(`/api/tenants/${id}`, editData);
      toast.success("Informations mises à jour");
      setEditing(false);
      fetchTenantDetails();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleUploadDocument = async () => {
    if (!documentFile || !documentName) {
      toast.error("Veuillez sélectionner un fichier et entrer un nom");
      return;
    }
    const formData = new FormData();
    formData.append("file", documentFile);
    formData.append("name", documentName);
    formData.append("doc_type", documentType);

    try {
      await api.post(`/api/tenants/${id}/documents`, formData);
      toast.success("Document uploadé");
      setDocumentFile(null);
      setDocumentName("");
      fetchTenantDetails();
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    }
  };

 const handleUploadContract = async () => {
    if (!contractFile || !lease) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }
    const formData = new FormData();
    formData.append("file", contractFile);

    try {
      await api.post(`/api/leases/${lease.lease_id}/contract`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Contrat uploadé");
      setContractFile(null);
      fetchTenantDetails();
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await api.delete(`/api/documents/${documentId}`);
      toast.success("Document supprimé");
      fetchTenantDetails();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getLatestPaymentStatus = () => {
    if (payments.length === 0) return null;
    const sorted = [...payments].sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
    return sorted[0]?.status;
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

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">Locataire non trouvé</p>
        <Button onClick={() => navigate("/locataires")} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="locataire-details-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/locataires")} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Fiche Client</h1>
            <p className="text-[var(--muted-foreground)]">Informations & documents du locataire</p>
          </div>
        </div>
        
        {getLatestPaymentStatus() && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted-foreground)]">Statut paiement :</span>
            {getStatusBadge(getLatestPaymentStatus())}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Informations Personnelles</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-[var(--muted-foreground)] text-xs uppercase">Nom complet</Label>
              {editing ? (
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="mt-1 bg-[var(--input)]"
                  data-testid="edit-name-input"
                />
              ) : (
                <p className="text-[var(--text)] font-medium mt-1">{tenant.full_name}</p>
              )}
            </div>
            
            <div>
              <Label className="text-[var(--muted-foreground)] text-xs uppercase">Téléphone</Label>
              {editing ? (
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="mt-1 bg-[var(--input)]"
                  data-testid="edit-phone-input"
                />
              ) : (
                <p className="text-[var(--text)] mt-1">{tenant.phone || "---"}</p>
              )}
            </div>
            
            <div>
              <Label className="text-[var(--muted-foreground)] text-xs uppercase">Email</Label>
              {editing ? (
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="mt-1 bg-[var(--input)]"
                  data-testid="edit-email-input"
                />
              ) : (
                <p className="text-[var(--text)] mt-1">{tenant.email || "---"}</p>
              )}
            </div>
            
            {lease && (
              <>
                <div>
                  <Label className="text-[var(--muted-foreground)] text-xs uppercase">Début du bail</Label>
                  <p className="text-[var(--text)] mt-1">
                    {new Date(lease.start_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                
                <div>
                  <Label className="text-[var(--muted-foreground)] text-xs uppercase">Loyer mensuel</Label>
                  <p className="text-[var(--text)] font-medium mt-1">
                    {lease.loyer_mensuel
                      ? new Intl.NumberFormat("fr-SN").format(lease.loyer_mensuel) + " FCFA"
                      : "---"}
                  </p>
                </div>
              </>
            )}

            {editing ? (
              <div className="flex gap-2">
                <Button onClick={handleUpdateTenant} className="bg-[var(--primary)]" data-testid="save-tenant-btn">
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Annuler
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setEditing(true)} 
                className="bg-[var(--primary)] hover:bg-[#4a7063] text-white"
                data-testid="edit-tenant-btn"
              >
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Contract */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Contrat & Bail</h2>
          
          {lease?.contract_file_path ? (
            <div className="p-4 border border-[var(--border)] rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--primary)]">Bail signé</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    PDF - Ajouté le {new Date().toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(lease.contract_file_path, "_blank")} /* L'URL du fichier est maintenant complète et directe 
                    (ex: https://xxx.supabase.co/storage/... Plus besoin de passer par /api/files/ du back.*/
                    data-testid="view-contract-btn"
                  >
                    Voir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="download-contract-btn"
                  >
                    Télécharger
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--muted-foreground)] mb-4">Aucun contrat uploadé</p>
          )}

          {lease && (
            <div className="p-4 border border-dashed border-[var(--border)] rounded-xl">
              <p className="text-center text-[var(--muted-foreground)] mb-4">
                Ajouter / remplacer le contrat
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setContractFile(e.target.files[0])}
                  className="flex-1 text-sm"
                  data-testid="contract-file-input"
                />
              </div>
              <Button
                onClick={handleUploadContract}
                disabled={!contractFile}
                className="w-full mt-4 bg-[var(--primary)]"
                data-testid="upload-contract-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Uploader
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="propria-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Documents Personnels</h2>
          <span className="text-sm text-[var(--muted-foreground)]">{documents.length} documents</span>
        </div>

        {documents.length > 0 && (
          <div className="overflow-x-auto mb-6">
            <table className="propria-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id} data-testid={`doc-row-${doc.document_id}`}>
                    <td className="font-medium">{doc.name}</td>
                    <td>{doc.doc_type}</td>
                    <td>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.file_url, "_blank")}
                          data-testid={`view-doc-${doc.document_id}`}
                        >
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.document_id)}
                          className="text-red-500 hover:bg-red-50"
                          data-testid={`delete-doc-${doc.document_id}`}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Upload new document */}
        <div className="p-4 border border-dashed border-[var(--border)] rounded-xl">
          <p className="text-center text-[var(--muted-foreground)] mb-4">
            Ajouter un document personnel
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Nom du document"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="bg-[var(--input)]"
              data-testid="doc-name-input"
            />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="propria-input"
              data-testid="doc-type-select"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="other">Autre</option>
            </select>
            <input
              type="file"
              onChange={(e) => setDocumentFile(e.target.files[0])}
              className="text-sm"
              data-testid="doc-file-input"
            />
          </div>
          <Button
            onClick={handleUploadDocument}
            disabled={!documentFile || !documentName}
            className="w-full mt-4 bg-[var(--primary)]"
            data-testid="upload-doc-btn"
          >
            <Upload className="w-4 h-4 mr-2" />
            Uploader
          </Button>
        </div>
      </div>
    </div>
  );
}
