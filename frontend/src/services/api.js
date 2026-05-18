// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Intercepteur requête ──────────────────────────────────────────
// Injecte automatiquement le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("propria_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Intercepteur réponse ──────────────────────────────────────────
// Si le backend retourne 401 (token expiré ou invalide) :
// - Supprime le token du localStorage
// - Redirige vers /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("propria_token");
      localStorage.removeItem("propria_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
