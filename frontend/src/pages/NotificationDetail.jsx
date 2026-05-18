import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, AlertTriangle, FileText, Send, Clock } from "lucide-react";
import { Button } from "../components/ui/button";

const NOTIFICATION_LINKS = {
  "Paiement en retard": { label: "Voir les paiements", path: "/paiements", icon: AlertTriangle },
  "Nouveau document": { label: "Voir les documents", path: "/documents", icon: FileText },
  "Relance envoyée": { label: "Voir les relances", path: "/relances", icon: Send },
};

function getNotificationIcon(title) {
  if (!title) return Bell;
  if (title.toLowerCase().includes("paiement")) return AlertTriangle;
  if (title.toLowerCase().includes("document")) return FileText;
  if (title.toLowerCase().includes("relance")) return Send;
  return Bell;
}

function getNotificationColor(title) {
  if (!title) return "var(--primary)";
  if (title.toLowerCase().includes("paiement")) return "var(--destructive)";
  if (title.toLowerCase().includes("document")) return "var(--primary)";
  if (title.toLowerCase().includes("relance")) return "var(--success)";
  return "var(--primary)";
}

export default function NotificationDetail() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const notification = state?.notification;

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Bell className="w-12 h-12 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">Notification introuvable.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const Icon = getNotificationIcon(notification.title);
  const color = getNotificationColor(notification.title);
  const link = NOTIFICATION_LINKS[notification.title];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--text)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux notifications
      </button>

      {/* Card */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-md overflow-hidden">
        {/* Header band */}
        <div className="h-2 w-full" style={{ backgroundColor: color }} />

        <div className="p-8">
          {/* Icon + title */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)]">{notification.title}</h1>
              <div className="flex items-center gap-1 mt-1 text-xs text-[var(--muted-foreground)]">
                <Clock className="w-3 h-3" />
                <span>{notification.time}</span>
              </div>
            </div>
            {notification.unread && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: color }}>
                Non lu
              </span>
            )}
          </div>

          {/* Message */}
          <div className="bg-[var(--muted)] rounded-xl p-5 mb-8">
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">Message</p>
            <p className="text-[var(--text)] leading-relaxed">{notification.message}</p>
          </div>

          {/* CTA */}
          {link && (
            <Button
              onClick={() => navigate(link.path)}
              className="w-full"
              style={{ backgroundColor: color, color: "#fff" }}
            >
              <link.icon className="w-4 h-4 mr-2" />
              {link.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
