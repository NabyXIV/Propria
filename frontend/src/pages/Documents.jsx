import { useState, useEffect } from "react";
import { FileText, Upload, Eye, Trash2, Download, FolderOpen } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import api from "../services/api";

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("pdf");
  const [uploadTenant, setUploadTenant] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedTenant]);

  const fetchData = async () => {
    try {
      const url = selectedTenant && selectedTenant !== "all"
        ? `/api/documents?tenant_id=${selectedTenant}`
        : "/api/documents";

      const [docsRes, tenantsRes] = await Promise.all([
        api.get(url),
        api.get("/api/tenants")
      ]);
      setDocuments(docsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!documentFile || !documentName || !uploadTenant) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const formData = new FormData();
    formData.append("file", documentFile);
    formData.append("name", documentName);
    formData.append("doc_type", documentType);

    try {
      await api.post(`/api/tenants/${uploadTenant}/documents`, formData);
      toast.success("Document uploadé");
      setDocumentFile(null);
      setDocumentName("");
      setUploadTenant("");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de l'upload");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!confirm("Supprimer ce document ?")) return;
    try {
      await api.delete(`/api/documents/${documentId}`);
      toast.success("Document supprimé");
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    return tenant?.full_name || "N/A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="documents-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Documents</h1>
        <p className="text-[var(--muted-foreground)]">Gestion des documents locataires</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Ajouter un document</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Locataire</Label>
              <Select value={uploadTenant} onValueChange={setUploadTenant}>
                <SelectTrigger className="bg-[var(--input)]" data-testid="upload-tenant-select">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom du document</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Carte d'identité"
                className="bg-[var(--input)]"
                data-testid="doc-name-input"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="bg-[var(--input)]" data-testid="doc-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fichier</Label>
              <input
                type="file"
                onChange={(e) => setDocumentFile(e.target.files[0])}
                className="w-full text-sm mt-1"
                data-testid="doc-file-input"
              />
            </div>

            <Button 
              onClick={handleUploadDocument}
              disabled={!documentFile || !documentName || !uploadTenant}
              className="w-full bg-[var(--primary)]"
              data-testid="upload-doc-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              Uploader
            </Button>
          </div>
        </div>

        {/* Documents List */}
        <div className="lg:col-span-2 propria-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Tous les documents</h2>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Filtrer par:</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-48 bg-[var(--input)]" data-testid="filter-tenant-select">
                  <SelectValue placeholder="Tous les locataires" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">Aucun document</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="propria-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Locataire</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.document_id} data-testid={`doc-row-${doc.document_id}`}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[var(--primary)]" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </td>
                      <td>{getTenantName(doc.tenant_id)}</td>
                      <td>
                        <span className="text-xs bg-[var(--muted)] px-2 py-1 rounded">
                          {doc.doc_type}
                        </span>
                      </td>
                      <td>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}/api/files/${doc.file_path}`, "_blank")}
                            data-testid={`view-doc-${doc.document_id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDocument(doc.document_id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`delete-doc-${doc.document_id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
