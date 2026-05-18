import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPaymentByToken, initiatePayment } from "../services/payments";

const ERROR_MESSAGES = {
  INVALID_TOKEN: "Ce lien de paiement n'existe pas.",
  EXPIRED_TOKEN: "Ce lien a expiré. Contactez votre gérant.",
};

function formatAmount(amount) {
  return amount.toLocaleString("fr-SN");
}

// ─── Sub-components ──────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E8F3EF 0%, #F5FAF7 50%, #EDF5F1 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          background: '#4E7A6C',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 4px 14px rgba(78,122,108,0.3)',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12h6v10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#1E2B28', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
          Propria
        </span>
        <p style={{ fontSize: '13px', color: '#6B7C75', marginTop: '2px' }}>
          Gestion Locative
        </p>
      </div>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {children}
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      padding: '32px 28px',
      border: '1px solid rgba(78,122,108,0.12)',
      boxShadow: '0 8px 32px rgba(30,43,40,0.08), 0 2px 8px rgba(30,43,40,0.04)',
    }}>
      {children}
    </div>
  );
}

// ─── State views ─────────────────────────────────────────────────

function LoadingView() {
  return (
    <PageShell>
      <Card>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-[var(--muted-foreground)] text-sm">Chargement du paiement…</p>
        </div>
      </Card>
    </PageShell>
  );
}

function ErrorView({ errorType }) {
  const message = ERROR_MESSAGES[errorType] ?? "Une erreur est survenue.";
  return (
    <PageShell>
      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center">
            <span className="text-[var(--destructive)] text-xl font-bold">!</span>
          </div>
          <p className="font-semibold text-[var(--text)]">Lien invalide</p>
          <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
        </div>
      </Card>
    </PageShell>
  );
}

function PaidView({ payment }) {
  return (
    <PageShell>
      <Card>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
            <span className="text-[var(--success)] text-2xl">✓</span>
          </div>
          <p className="font-semibold text-[var(--text)]">Paiement déjà effectué</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Le loyer de {payment.month} a bien été reçu. Merci.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}

function PayingView() {
  return (
    <PageShell>
      <Card>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="font-medium text-[var(--text)]">Redirection en cours…</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Vous allez être redirigé vers la page de paiement.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}

function ReadyView({ payment, onPay }) {
  const montantFormate = Math.round(payment.amount).toLocaleString('fr-SN');
  return (
    <PageShell>
      <Card>
        {/* Tenant info */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7C75', marginBottom: '4px' }}>
            Locataire
          </p>
          <p style={{ fontWeight: '600', color: '#1E2B28', fontSize: '17px', fontFamily: "'Outfit', sans-serif" }}>
            {payment.tenant_name}
          </p>
          <p style={{ fontSize: '13px', color: '#6B7C75', marginTop: '2px' }}>{payment.apartment}</p>
        </div>

        {/* Month + Amount */}
        <div style={{
          background: 'linear-gradient(135deg, #4E7A6C 0%, #3D6357 100%)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(78,122,108,0.3)',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '6px' }}>{payment.month}</p>
          <p style={{ fontSize: '38px', fontWeight: '700', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {montantFormate}
            <span style={{ fontSize: '16px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginLeft: '8px' }}>
              FCFA
            </span>
          </p>
        </div>

        {/* Payment buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => onPay("wave")}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              fontWeight: '600', color: '#FFFFFF', fontSize: '14px',
              background: 'linear-gradient(135deg, #1B90F7 0%, #0E7AE0 100%)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(27,144,247,0.35)',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Payer avec Wave
          </button>
          <button
            onClick={() => onPay("orange-money")}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: '12px',
              fontWeight: '600', color: '#FFFFFF', fontSize: '14px',
              background: 'linear-gradient(135deg, #FF6600 0%, #E55A00 100%)',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255,102,0,0.35)',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Payer avec Orange Money
          </button>
        </div>

        {/* Security badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#6B7C75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="#6B7C75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: '12px', color: '#6B7C75' }}>Paiement sécurisé via PayDunya</p>
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function Payer() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [payment, setPayment] = useState(null);
  const [errorType, setErrorType] = useState(null);

  useEffect(() => {
    getPaymentByToken(token)
      .then((data) => {
        setPayment(data);
        setStatus(data.status === "paid" ? "paid" : "ready");
      })
      .catch((err) => {
        setErrorType(err?.code ?? "INVALID_TOKEN");
        setStatus("error");
      });
  }, [token]);

  const handlePay = async (method) => {
    setStatus("paying");
    try {
      await initiatePayment(token, method);
    } catch {
      setStatus("ready");
    }
  };

  if (status === "loading") return <LoadingView />;
  if (status === "error")   return <ErrorView errorType={errorType} />;
  if (status === "paid")    return <PaidView payment={payment} />;
  if (status === "paying")  return <PayingView />;

  return <ReadyView payment={payment} onPay={handlePay} />;
}
