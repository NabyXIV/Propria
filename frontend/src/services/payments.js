// src/services/payments.js

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ─── Mode mock ─────────────────────────────────────────────────────
// Passer à false quand le backend expose les endpoints réels
const MOCK = true;

const mockPayment = {
  tenant_name: "Lamine Thiam",
  apartment: "Apt 3B — Immeuble Dakar Center",
  amount: 150000,
  currency: "XOF",
  month: "Mai 2026",
  status: "pending", // changer en "paid" pour tester l'état paiement déjà effectué
};

// ─── getPaymentByToken ─────────────────────────────────────────────
// TODO: remplacer par appel API réel — GET /payments/public/{token}
// Réponse attendue : { tenant_name, apartment, amount, currency, month, status }
// Erreurs attendues : 404 → INVALID_TOKEN, 410 → EXPIRED_TOKEN
export async function getPaymentByToken(token) {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return mockPayment;
  }

  const response = await fetch(`${API_URL}/payments/public/${token}`);
  if (response.status === 404) throw { code: "INVALID_TOKEN" };
  if (response.status === 410) throw { code: "EXPIRED_TOKEN" };
  if (!response.ok) throw { code: "SERVER_ERROR" };
  return response.json();
}

// ─── initiatePayment ───────────────────────────────────────────────
// TODO: remplacer par appel API réel — POST /payments/public/{token}/initiate
// Body : { method: "wave" | "orange-money" }
// Réponse attendue : { checkout_url: "https://app.paydunya.com/..." }
// Le frontend redirige vers checkout_url — PayDunya gère la suite
export async function initiatePayment(token, method) {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    console.log(`[MOCK] Initier paiement — méthode : ${method}, token : ${token}`);
    return;
  }

  const response = await fetch(`${API_URL}/payments/public/${token}/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method }),
  });

  if (!response.ok) throw { code: "PAYMENT_INIT_FAILED" };
  const data = await response.json();

  if (data.checkout_url) {
    window.location.href = data.checkout_url;
  }
}
