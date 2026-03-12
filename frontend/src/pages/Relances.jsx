import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Copy, Check, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Relances() {
  const [latePayments, setLatePayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("propria_token");
    return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [paymentsRes, remindersRes] = await Promise.all([
        fetch(`${API_URL}/api/payments?status=LATE`, { headers, credentials: "include" }),
        fetch(`${API_URL}/api/reminders`, { headers, credentials: "include" })
      ]);

      if (paymentsRes.ok) {
        setLatePayments(await paymentsRes.json());
      }
      if (remindersRes.ok) {
        setReminders(await remindersRes.json());
      }
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const generateMessage = (payment) => {
    const message = `Bonjour ${payment.tenant_name || ""},

Nous vous rappelons que votre loyer de ${payment.amount}$ pour la période ${payment.period} est en retard.
Date d'échéance: ${new Date(payment.due_date).toLocaleDateString("fr-FR")}

Merci de régulariser votre situation dans les plus brefs délais.

Cordialement,
Propria - Gestion Locative`;

    setGeneratedMessage(message);
    setSelectedPayment(payment);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    toast.success("Message copié");
    setTimeout(() => setCopied(false), 2000);
  };

  const sendReminder = async () => {
    if (!selectedPayment) return;

    try {
      // Find tenant_id from payment
      const tenant = latePayments.find(p => p.payment_id === selectedPayment.payment_id);
      if (!tenant) {
        toast.error("Locataire non trouvé");
        return;
      }

      // Get leases to find tenant_id
      const leasesRes = await fetch(`${API_URL}/api/leases`, {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      
      if (!leasesRes.ok) throw new Error();
      
      const leases = await leasesRes.json();
      const lease = leases.find(l => l.lease_id === selectedPayment.lease_id);
      
      if (!lease) {
        toast.error("Bail non trouvé");
        return;
      }

      const response = await fetch(`${API_URL}/api/reminders`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          tenant_id: lease.tenant_id,
          payment_id: selectedPayment.payment_id,
          template_type: "sms",
          channel: "sms"
        })
      });

      if (response.ok) {
        toast.success("Relance enregistrée");
        setGeneratedMessage("");
        setSelectedPayment(null);
        fetchData();
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(amount);
  };

  const isAlreadyReminded = (paymentId) => {
    return reminders.some(r => r.payment_id === paymentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="relances-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Relances</h1>
        <p className="text-[var(--muted-foreground)]">Gestion des paiements en retard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Late Payments List */}
        <div className="lg:col-span-2 propria-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Paiements en retard</h2>
            <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
              {latePayments.length} en retard
            </span>
          </div>

          {latePayments.length === 0 ? (
            <div className="text-center py-12">
              <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-[var(--text)] font-medium">Aucun paiement en retard</p>
              <p className="text-[var(--muted-foreground)]">Tous les loyers sont à jour</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="propria-table">
                <thead>
                  <tr>
                    <th>Locataire</th>
                    <th>Bien</th>
                    <th>Période</th>
                    <th>Montant</th>
                    <th>Échéance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {latePayments.map((payment) => (
                    <tr key={payment.payment_id} data-testid={`late-payment-row-${payment.payment_id}`}>
                      <td>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{payment.tenant_name || "N/A"}</span>
                        </div>
                      </td>
                      <td>{payment.building_name} - {payment.unit_name}</td>
                      <td>{payment.period}</td>
                      <td className="font-medium text-red-500">{formatCurrency(payment.amount)}</td>
                      <td>{new Date(payment.due_date).toLocaleDateString("fr-FR")}</td>
                      <td>
                        {isAlreadyReminded(payment.payment_id) ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Relancé
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => generateMessage(payment)}
                            className="bg-[var(--primary)]"
                            data-testid={`generate-reminder-${payment.payment_id}`}
                          >
                            <Bell className="w-4 h-4 mr-1" />
                            Relancer
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Message Generator */}
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Message de relance</h2>
          
          {generatedMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--muted)] rounded-xl">
                <p className="text-sm whitespace-pre-line">{generatedMessage}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={copyMessage}
                  variant="outline"
                  className="flex-1"
                  data-testid="copy-message-btn"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copié" : "Copier"}
                </Button>
                <Button
                  onClick={sendReminder}
                  className="flex-1 bg-[var(--primary)]"
                  data-testid="mark-reminded-btn"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Marquer relancé
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-4" />
              <p className="text-[var(--muted-foreground)]">
                Sélectionnez un paiement en retard pour générer un message de relance
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reminder History */}
      {reminders.length > 0 && (
        <div className="propria-card">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Historique des relances</h2>
          <div className="overflow-x-auto">
            <table className="propria-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Canal</th>
                  <th>Paiement</th>
                </tr>
              </thead>
              <tbody>
                {reminders.slice(0, 10).map((reminder) => (
                  <tr key={reminder.reminder_id} data-testid={`reminder-row-${reminder.reminder_id}`}>
                    <td>{new Date(reminder.sent_at).toLocaleDateString("fr-FR")}</td>
                    <td>
                      <span className="text-xs bg-[var(--muted)] px-2 py-1 rounded uppercase">
                        {reminder.channel}
                      </span>
                    </td>
                    <td>{reminder.payment_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
